# api/equity-calculator.py

import os
import json
import pandas as pd
from datetime import datetime
from supabase import create_client, Client

# Supabase client initialization
# IMPORTANT: These should be set as environment variables in your Vercel project
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role Key for backend security

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase URL or Key environment variables are not set for the backend.")
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Helper function for equity calculations ---
def calculate_equity_snapshot(issuances_data, shareholders_data, share_classes_data):
    """
    Calculates equity metrics (total shares, value, percentages) from raw data.
    """
    if not issuances_data:
        return {
            "totalShares": 0,
            "totalValue": 0,
            "classSummary": [],
            "shareholderSummary": [],
            "latestValuationPerShare": 0,
            "companyValuation": 0
        }

    df_issuances = pd.DataFrame(issuances_data)
    df_shareholders = pd.DataFrame(shareholders_data)
    df_share_classes = pd.DataFrame(share_classes_data)

    df_issuances['shares'] = pd.to_numeric(df_issuances['shares'])
    df_issuances['price_per_share'] = pd.to_numeric(df_issuances['price_per_share'])
    df_issuances['value'] = df_issuances['shares'] * df_issuances['price_per_share']

    total_shares = df_issuances['shares'].sum()
    total_value = df_issuances['value'].sum()

    latest_valuation_per_share = 0
    if not df_issuances.empty:
        df_issuances['issue_date'] = pd.to_datetime(df_issuances['issue_date'])
        df_issuances = df_issuances.sort_values(by=['issue_date', 'created_at'], ascending=[False, False])
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
                "id": int(share_class['id']),
                "name": share_class['name'],
                "priority": int(share_class['priority']),
                "totalShares": int(row['totalShares']),
                "totalValue": float(row['totalValue']),
                "percentage": round(percentage, 2),
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
                    "id": int(issuance['id']),
                    "shares": int(issuance['shares']),
                    "price_per_share": float(issuance['price_per_share']),
                    "issue_date": issuance['issue_date'].strftime('%Y-%m-%d'),
                    "shareClassName": share_class_name,
                    "valuation": float(issuance['value']),
                    "round": issuance['round']
                })
            
            shareholder_summary.append({
                "id": int(shareholder['id']),
                "name": shareholder['name'],
                "email": shareholder['email'],
                "type": shareholder['type'],
                "totalShares": int(total_shares_sh),
                "totalValue": float(total_value_sh),
                "holdings": holdings
            })
    shareholder_summary = sorted(shareholder_summary, key=lambda x: x['totalShares'], reverse=True)

    return {
        "totalShares": int(total_shares),
        "totalValue": float(total_value),
        "classSummary": class_summary,
        "shareholderSummary": shareholder_summary,
        "latestValuationPerShare": float(latest_valuation_per_share),
        "companyValuation": float(company_valuation)
    }

# --- Vercel Serverless Function Handler ---
def handler(request, context):
    """
    Main entry point for Vercel Serverless Function.
    Handles equity calculations and admin data access.
    """
    # Set CORS headers for preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS') # Added GET, DELETE, PUT
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization') # Added Authorization
        response.headers.add('Access-Control-Max-Age', '3600')
        return response

    # Set CORS headers for main requests
    headers = {
        'Access-Control-Allow-Origin': '*'
    }

    try:
        if supabase is None:
            return jsonify({"error": "Supabase client not initialized. Check environment variables."}), 500

        # --- Admin Endpoints ---
        # These endpoints require the Service Role Key and are for admin use only.
        # The frontend should only call these if the user is identified as admin.
        # Authentication/Authorization check should ideally happen here using a secure token.
        # For simplicity, we're relying on the SERVICE_ROLE_KEY to be present,
        # but in a real app, you'd verify an admin token from the request header.

        path = request.path
        if path.startswith('/api/admin'):
            # Basic check for service role key (should be secure on Vercel)
            # In a real app, you'd verify an admin JWT passed from frontend
            # if request.headers.get('Authorization') != f"Bearer {os.environ.get('YOUR_ADMIN_FRONTEND_TOKEN')}":
            #    return jsonify({"error": "Unauthorized"}), 401
            
            if request.method == 'GET':
                if path == '/api/admin/users':
                    response_users = supabase.from('user_profiles').select('*').execute()
                    return jsonify(response_users.data if response_users.data else []), 200, headers
                elif path == '/api/admin/companies':
                    response_companies = supabase.from('companies').select('*').execute()
                    return jsonify(response_companies.data if response_companies.data else []), 200, headers
                elif path == '/api/admin/issuances':
                    response_issuances = supabase.from('share_issuances').select('*').execute()
                    return jsonify(response_issuances.data if response_issuances.data else []), 200, headers
                
            elif request.method == 'DELETE':
                data = request.get_json()
                item_id = data.get('id')
                item_type = data.get('type') # 'user', 'company', 'issuance'

                if not item_id or not item_type:
                    return jsonify({"error": "id and type are required for deletion"}), 400, headers

                if item_type == 'user':
                    # Deleting from auth.users requires admin API
                    # This will also cascade delete from user_profiles due to FK
                    auth_response = supabase.auth.admin.delete_user(item_id)
                    if auth_response.user is None: # Supabase returns None for user on successful delete
                        return jsonify({"message": f"User {item_id} and associated data deleted."}), 200, headers
                    else:
                        return jsonify({"error": f"Failed to delete user {item_id}: {auth_response.error.message}"}), 500, headers
                elif item_type == 'company':
                    response = supabase.from('companies').delete().eq('id', item_id).execute()
                    return jsonify({"message": f"Company {item_id} and associated data deleted."}), 200, headers
                elif item_type == 'issuance':
                    response = supabase.from('share_issuances').delete().eq('id', item_id).execute()
                    return jsonify({"message": f"Issuance {item_id} deleted."}), 200, headers
                else:
                    return jsonify({"error": "Invalid item type for deletion"}), 400, headers
            
            # Add PUT/PATCH for modification if needed, similar structure
            return jsonify({"error": "Admin endpoint not found or method not allowed"}), 404, headers

        # --- Standard Equity Calculation Endpoint ---
        elif request.method == 'POST' and path == '/api/equity-calculator':
            data = request.get_json()
            company_id = data.get('companyId')
            current_issuances = data.get('currentIssuances', [])
            shareholders = data.get('shareholders', [])
            share_classes = data.get('shareClasses', [])
            future_issuance = data.get('futureIssuance')
            
            if not company_id:
                return jsonify({"error": "companyId is required"}), 400, headers

            current_state_data = calculate_equity_snapshot(current_issuances, shareholders, share_classes)

            future_state_data = None
            if future_issuance:
                future_issuances = list(current_issuances)
                
                future_issuance_processed = {
                    "id": f"future_{datetime.now().timestamp()}",
                    "company_id": company_id,
                    "shareholder_id": int(future_issuance['shareholderId']),
                    "share_class_id": int(future_issuance['shareClassId']),
                    "shares": int(future_issuance['shares']),
                    "price_per_share": float(future_issuance['pricePerShare']),
                    "issue_date": future_issuance['issueDate'],
                    "round": future_issuance['round'] or 'Future Scenario',
                    "created_at": datetime.now().isoformat()
                }
                future_issuances.append(future_issuance_processed)
                
                future_state_data = calculate_equity_snapshot(future_issuances, shareholders, share_classes)

                current_shareholder_percentages = {
                    sh['id']: (sh['totalShares'] / current_state_data['totalShares'] * 100) if current_state_data['totalShares'] > 0 else 0
                    for sh in current_state_data['shareholderSummary']
                }

                for sh_future in future_state_data['shareholderSummary']:
                    current_percentage = current_shareholder_percentages.get(sh_future['id'], 0)
                    future_percentage = (sh_future['totalShares'] / future_state_data['totalShares'] * 100) if future_state_data['totalShares'] > 0 else 0
                    
                    sh_future['percentageChange'] = round(future_percentage - current_percentage, 2)
                    sh_future['currentPercentage'] = round(current_percentage, 2)
                    sh_future['futurePercentage'] = round(future_percentage, 2)

            response_data = {
                "current_state": current_state_data,
                "future_state": future_state_data
            }
            
            response = jsonify(response_data)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
        return jsonify({"error": "Endpoint not found"}), 404, headers

    except Exception as e:
        print(f"Error in handler: {e}")
        response = jsonify({"error": str(e)}), 500
        response[0].headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    return jsonify({"error": "Method Not Allowed"}), 405, headers # Fallback for unhandled methods/paths
