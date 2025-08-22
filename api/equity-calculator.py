# api/equity-calculator.py

import os
import json
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
import traceback
from urllib.parse import urlparse, parse_qs

# Supabase client initialization
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("Error: Supabase URL or Key environment variables are not set for the backend.")

# --- Helper function for equity calculations ---
def calculate_equity_snapshot(issuances_data, shareholders_data, share_classes_data):
    """
    Calculates equity metrics (total shares, value, percentages) from raw data.
    """
    if not issuances_data or not shareholders_data or not share_classes_data:
        return {
            "totalShares": 0, "totalValue": 0, "classSummary": [],
            "shareholderSummary": [], "latestValuationPerShare": 0, "companyValuation": 0
        }

    df_issuances = pd.DataFrame(issuances_data)
    df_issuances['shares'] = pd.to_numeric(df_issuances['shares'])
    df_issuances['price_per_share'] = pd.to_numeric(df_issuances['price_per_share'])
    df_issuances['shareholder_id'] = pd.to_numeric(df_issuances['shareholder_id'])
    df_issuances['share_class_id'] = pd.to_numeric(df_issuances['share_class_id'])
    
    df_shareholders = pd.DataFrame(shareholders_data)
    df_shareholders['id'] = pd.to_numeric(df_shareholders['id'])

    df_share_classes = pd.DataFrame(share_classes_data)
    df_share_classes['id'] = pd.to_numeric(df_share_classes['id'])

    df_issuances['value'] = df_issuances['shares'] * df_issuances['price_per_share']
    total_shares = df_issuances['shares'].sum()
    total_value = df_issuances['value'].sum()

    latest_valuation_per_share = 0
    if not df_issuances.empty:
        df_issuances['issue_date'] = pd.to_datetime(df_issuances['issue_date'])
        sort_keys = ['issue_date']
        if 'created_at' in df_issuances.columns:
            sort_keys.append('created_at')
        df_issuances = df_issuances.sort_values(by=sort_keys, ascending=False, kind='mergesort')
        latest_valuation_per_share = df_issuances.iloc[0]['price_per_share']
    
    company_valuation = total_shares * latest_valuation_per_share

    class_summary_raw = df_issuances.groupby('share_class_id').agg(
        totalShares=('shares', 'sum'),
        totalValue=('value', 'sum')
    ).reset_index()

    class_summary = []
    for _, row in class_summary_raw.iterrows():
        share_class_match = df_share_classes[df_share_classes['id'] == row['share_class_id']]
        if not share_class_match.empty:
            share_class = share_class_match.iloc[0].to_dict()
            percentage = (row['totalShares'] / total_shares * 100) if total_shares > 0 else 0
            issuances_for_class = df_issuances[df_issuances['share_class_id'] == row['share_class_id']]
            round_name = issuances_for_class['round'].iloc[0] if not issuances_for_class.empty else 'N/A'
            class_summary.append({
                "id": int(share_class['id']), "name": share_class.get('name'),
                "priority": int(share_class.get('priority', 99)), "totalShares": int(row['totalShares']),
                "totalValue": float(row['totalValue']), "percentage": round(percentage, 2),
                "round": round_name
            })
    class_summary = sorted(class_summary, key=lambda x: x['priority'])

    shareholder_summary = []
    shareholder_groups = df_issuances.groupby('shareholder_id')
    for shareholder_id, group in shareholder_groups:
        shareholder_match = df_shareholders[df_shareholders['id'] == shareholder_id]
        if not shareholder_match.empty:
            shareholder = shareholder_match.iloc[0].to_dict()
            total_shares_sh = group['shares'].sum()
            total_value_sh = group['value'].sum()
            holdings = []
            for _, issuance_row in group.iterrows():
                issuance = issuance_row.to_dict()
                share_class_match = df_share_classes[df_share_classes['id'] == issuance['share_class_id']]
                share_class_name = share_class_match.iloc[0]['name'] if not share_class_match.empty else 'Unknown'
                holdings.append({
                    "id": int(issuance['id']), "shares": int(issuance['shares']),
                    "price_per_share": float(issuance['price_per_share']),
                    "issue_date": issuance['issue_date'].strftime('%Y-%m-%d'),
                    "shareClassName": share_class_name, "valuation": float(issuance['value']),
                    "round": issuance.get('round')
                })
            shareholder_summary.append({
                "id": int(shareholder['id']), "name": shareholder.get('name'),
                "email": shareholder.get('email'), "type": shareholder.get('type'),
                "totalShares": int(total_shares_sh), "totalValue": float(total_value_sh),
                "holdings": holdings
            })
    shareholder_summary = sorted(shareholder_summary, key=lambda x: x['totalShares'], reverse=True)

    return {
        "totalShares": int(total_shares), "totalValue": float(total_value),
        "classSummary": class_summary, "shareholderSummary": shareholder_summary,
        "latestValuationPerShare": float(latest_valuation_per_share),
        "companyValuation": float(company_valuation)
    }

# --- Vercel Serverless Function Handler ---
def handler(request, context=None):
    if request.method == 'OPTIONS':
        return '', 204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
    
    headers = {'Access-Control-Allow-Origin': '*'}

    try:
        if supabase is None:
            return {"error": "Supabase client not initialized"}, 500, headers

        # --- FIX: Robust routing for all request types within the single handler ---
        parsed_url = urlparse(request.url)
        query_params = parse_qs(parsed_url.query)

        # Admin GET requests for listing entities
        if request.method == 'GET' and 'entity' in query_params:
            entity = query_params['entity'][0]
            if entity == 'users':
                response = supabase.from_('user_profiles').select('*').execute()
                return response.data, 200, headers
            elif entity == 'companies':
                response = supabase.from_('companies').select('*').execute()
                return response.data, 200, headers
            elif entity == 'issuances':
                response = supabase.from_('share_issuances').select('*').execute()
                return response.data, 200, headers
            else:
                return {"error": "Invalid entity for GET request"}, 400, headers

        # Admin DELETE requests
        elif request.method == 'DELETE':
            data = request.get_json()
            item_id = data.get('id')
            item_type = data.get('type')
            if not item_id or not item_type:
                return {"error": "id and type are required for deletion"}, 400, headers
            
            if item_type == 'user':
                # This requires the admin client, which we are using via the service key
                auth_response = supabase.auth.admin.delete_user(item_id)
                # Successful deletion might not return a user object, check for error instead
                if hasattr(auth_response, 'error') and auth_response.error is not None:
                     return {"error": f"Failed to delete user {item_id}: {auth_response.error.message}"}, 500, headers
                return {"message": f"User {item_id} and associated data deleted."}, 200, headers
            elif item_type == 'company':
                supabase.from_('companies').delete().eq('id', item_id).execute()
                return {"message": f"Company {item_id} and associated data deleted."}, 200, headers
            elif item_type == 'issuance':
                supabase.from_('share_issuances').delete().eq('id', item_id).execute()
                return {"message": f"Issuance {item_id} deleted."}, 200, headers
            else:
                return {"error": "Invalid item type for deletion"}, 400, headers
        
        # POST request for equity calculation
        elif request.method == 'POST':
            data = request.get_json()
            if 'companyId' in data: # This identifies it as a calculation request
                current_issuances = data.get('currentIssuances', [])
                shareholders = data.get('shareholders', [])
                share_classes = data.get('shareClasses', [])
                future_issuance = data.get('futureIssuance')
                
                current_state_data = calculate_equity_snapshot(current_issuances, shareholders, share_classes)
                future_state_data = None

                if future_issuance:
                    future_issuances = list(current_issuances)
                    try:
                        future_issuance_processed = {
                            "id": f"future_{datetime.now().timestamp()}", "company_id": data.get('companyId'),
                            "shareholder_id": int(future_issuance.get('shareholderId')),
                            "share_class_id": int(future_issuance.get('shareClassId')),
                            "shares": int(future_issuance.get('shares')),
                            "price_per_share": float(future_issuance.get('pricePerShare')),
                            "issue_date": future_issuance.get('issueDate'),
                            "round": future_issuance.get('round') or 'Future Scenario',
                            "created_at": datetime.now().isoformat()
                        }
                    except (ValueError, TypeError) as e:
                        return {"error": f"Invalid or missing data in future issuance form: {e}"}, 400, headers

                    future_issuances.append(future_issuance_processed)
                    future_state_data = calculate_equity_snapshot(future_issuances, shareholders, share_classes)

                    current_shareholder_percentages = {
                        sh['id']: (sh['totalShares'] / current_state_data['totalShares'] * 100) if current_state_data['totalShares'] > 0 else 0
                        for sh in current_state_data['shareholderSummary']
                    }

                    for sh_future in future_state_data.get('shareholderSummary', []):
                        current_percentage = current_shareholder_percentages.get(sh_future['id'], 0)
                        future_percentage = (sh_future['totalShares'] / future_state_data['totalShares'] * 100) if future_state_data['totalShares'] > 0 else 0
                        sh_future['percentageChange'] = round(future_percentage - current_percentage, 2)
                        sh_future['currentPercentage'] = round(current_percentage, 2)
                        sh_future['futurePercentage'] = round(future_percentage, 2)

                response_data = {
                    "current_state": current_state_data,
                    "future_state": future_state_data
                }
                return response_data, 200, headers
        
        return {"error": "Endpoint not found or method not supported"}, 404, headers

    except Exception as e:
        print(f"Error in handler: {e}")
        traceback.print_exc()
        return {"error": f"A server error occurred: {str(e)}"}, 500, headers
    
    return {"error": "Method Not Allowed"}, 405, headers
