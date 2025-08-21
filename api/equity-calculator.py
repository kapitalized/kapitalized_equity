# api/equity-calculator.py

import os
import json
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
import traceback

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

    # --- FIX: Enforce numeric types for all ID columns to prevent mismatch errors ---
    df_issuances = pd.DataFrame(issuances_data)
    df_issuances['shares'] = pd.to_numeric(df_issuances['shares'])
    df_issuances['price_per_share'] = pd.to_numeric(df_issuances['price_per_share'])
    df_issuances['shareholder_id'] = pd.to_numeric(df_issuances['shareholder_id'])
    df_issuances['share_class_id'] = pd.to_numeric(df_issuances['share_class_id'])
    
    df_shareholders = pd.DataFrame(shareholders_data)
    df_shareholders['id'] = pd.to_numeric(df_shareholders['id'])

    df_share_classes = pd.DataFrame(share_classes_data)
    df_share_classes['id'] = pd.to_numeric(df_share_classes['id'])
    # --- END OF FIX ---

    df_issuances['value'] = df_issuances['shares'] * df_issuances['price_per_share']
    total_shares = df_issuances['shares'].sum()
    total_value = df_issuances['value'].sum()

    latest_valuation_per_share = 0
    if not df_issuances.empty:
        df_issuances['issue_date'] = pd.to_datetime(df_issuances['issue_date'])
        # Use a stable sort for cases where created_at might be missing
        df_issuances = df_issuances.sort_values(by=['issue_date'], ascending=False, kind='mergesort')
        if 'created_at' in df_issuances.columns:
             df_issuances = df_issuances.sort_values(by=['created_at'], ascending=False, kind='mergesort')
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
            share_class = share_class_match.iloc[0]
            percentage = (row['totalShares'] / total_shares * 100) if total_shares > 0 else 0
            issuances_for_class = df_issuances[df_issuances['share_class_id'] == row['share_class_id']]
            round_name = issuances_for_class['round'].iloc[0] if not issuances_for_class.empty else 'N/A'
            class_summary.append({
                "id": int(share_class['id']), "name": share_class['name'],
                "priority": int(share_class['priority']), "totalShares": int(row['totalShares']),
                "totalValue": float(row['totalValue']), "percentage": round(percentage, 2),
                "round": round_name
            })
    class_summary = sorted(class_summary, key=lambda x: x['priority'])

    shareholder_summary = []
    shareholder_groups = df_issuances.groupby('shareholder_id')
    for shareholder_id, group in shareholder_groups:
        shareholder_match = df_shareholders[df_shareholders['id'] == shareholder_id]
        if not shareholder_match.empty:
            shareholder = shareholder_match.iloc[0]
            total_shares_sh = group['shares'].sum()
            total_value_sh = group['value'].sum()
            holdings = []
            for _, issuance in group.iterrows():
                share_class_match = df_share_classes[df_share_classes['id'] == issuance['share_class_id']]
                share_class_name = share_class_match.iloc[0]['name'] if not share_class_match.empty else 'Unknown'
                holdings.append({
                    "id": int(issuance['id']), "shares": int(issuance['shares']),
                    "price_per_share": float(issuance['price_per_share']),
                    "issue_date": issuance['issue_date'].strftime('%Y-%m-%d'),
                    "shareClassName": share_class_name, "valuation": float(issuance['value']),
                    "round": issuance['round']
                })
            shareholder_summary.append({
                "id": int(shareholder['id']), "name": shareholder['name'],
                "email": shareholder['email'], "type": shareholder['type'],
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

        path = getattr(request, 'path', '')
        
        if request.method == 'POST' and path.endswith('/api/equity-calculator'):
            data = request.get_json()
            company_id = data.get('companyId')
            current_issuances = data.get('currentIssuances', [])
            shareholders = data.get('shareholders', [])
            share_classes = data.get('shareClasses', [])
            future_issuance = data.get('futureIssuance')
            
            if not company_id:
                return {"error": "companyId is required"}, 400, headers

            current_state_data = calculate_equity_snapshot(current_issuances, shareholders, share_classes)
            future_state_data = None

            if future_issuance:
                future_issuances = list(current_issuances)
                try:
                    future_issuance_processed = {
                        "id": f"future_{datetime.now().timestamp()}", "company_id": company_id,
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

                if current_state_data['totalShares'] > 0:
                    current_shareholder_percentages = {
                        sh['id']: (sh['totalShares'] / current_state_data['totalShares'] * 100)
                        for sh in current_state_data['shareholderSummary']
                    }
                else:
                    current_shareholder_percentages = {sh['id']: 0 for sh in current_state_data['shareholderSummary']}

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
        
        return {"error": "Endpoint not found"}, 404, headers

    except Exception as e:
        print(f"Error in handler: {e}")
        traceback.print_exc()
        return {"error": f"A server error occurred: {str(e)}"}, 500, headers
    
    return {"error": "Method Not Allowed"}, 405, headers
