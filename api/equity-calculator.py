# api/equity-calculator.py

import os
import json
import pandas as pd
from datetime import datetime
from supabase import create_client, Client

# Supabase client initialization (still needed for potential future direct DB ops, but not for fetching current data in this scenario)
# IMPORTANT: These should be set as environment variables in your Vercel project
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role Key for backend security

if not SUPABASE_URL or not SUPABASE_KEY:
    # In a real production environment, you'd want more robust error handling/logging here
    print("Error: Supabase URL or Key environment variables are not set for the backend.")
    supabase = None # Set to None if not configured, handle gracefully below
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

    # Convert to pandas DataFrames for easier manipulation
    df_issuances = pd.DataFrame(issuances_data)
    df_shareholders = pd.DataFrame(shareholders_data)
    df_share_classes = pd.DataFrame(share_classes_data)

    # Ensure numeric types
    df_issuances['shares'] = pd.to_numeric(df_issuances['shares'])
    df_issuances['price_per_share'] = pd.to_numeric(df_issuances['price_per_share'])

    # Calculate value per issuance
    df_issuances['value'] = df_issuances['shares'] * df_issuances['price_per_share']

    # --- Company-level summary ---
    total_shares = df_issuances['shares'].sum()
    total_value = df_issuances['value'].sum()

    # Calculate latest valuation per share
    latest_valuation_per_share = 0
    if not df_issuances.empty:
        # Sort by issue_date descending, then created_at descending
        df_issuances['issue_date'] = pd.to_datetime(df_issuances['issue_date'])
        df_issuances = df_issuances.sort_values(by=['issue_date', 'created_at'], ascending=[False, False])
        latest_valuation_per_share = df_issuances.iloc[0]['price_per_share']
    
    company_valuation = total_shares * latest_valuation_per_share

    # --- Share Class Summary ---
    class_summary_raw = df_issuances.groupby('share_class_id').agg(
        totalShares=('shares', 'sum'),
        totalValue=('value', 'sum')
    ).reset_index()

    class_summary = []
    for _, row in class_summary_raw.iterrows():
        # Ensure share_class is found before accessing its properties
        share_class_match = df_share_classes[df_share_classes['id'] == row['share_class_id']]
        if not share_class_match.empty:
            share_class = share_class_match.iloc[0]
            percentage = (row['totalShares'] / total_shares * 100) if total_shares > 0 else 0
            
            # Determine the round for the class summary (can be complex if a class has multiple rounds)
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

    # --- Shareholder Summary ---
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
    """
    if request.method == 'OPTIONS':
        # Handle CORS preflight request
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response

    if request.method == 'POST':
        try:
            # Removed Supabase client initialization check here, as it's done globally.
            # If supabase is None, it means env vars were not set at startup.
            
            data = request.get_json()
            company_id = data.get('companyId')
            current_issuances = data.get('currentIssuances', []) # Get data from payload
            shareholders = data.get('shareholders', [])       # Get data from payload
            share_classes = data.get('shareClasses', [])       # Get data from payload
            future_issuance = data.get('futureIssuance')
            
            if not company_id:
                return jsonify({"error": "companyId is required"}), 400

            # Calculate current state using data from payload
            current_state_data = calculate_equity_snapshot(current_issuances, shareholders, share_classes)

            # Calculate future scenario if provided
            future_state_data = None
            if future_issuance:
                # Create a deep copy to avoid modifying current_issuances
                future_issuances = list(current_issuances)
                
                # Ensure future_issuance has necessary fields and convert types
                future_issuance_processed = {
                    "id": f"future_{datetime.now().timestamp()}", # Unique ID for future issuance
                    "company_id": company_id,
                    "shareholder_id": int(future_issuance['shareholderId']),
                    "share_class_id": int(future_issuance['shareClassId']),
                    "shares": int(future_issuance['shares']),
                    "price_per_share": float(future_issuance['pricePerShare']),
                    "issue_date": future_issuance['issueDate'],
                    "round": future_issuance['round'] or 'Future Scenario',
                    "created_at": datetime.now().isoformat() # Add created_at for sorting
                }
                future_issuances.append(future_issuance_processed)
                
                future_state_data = calculate_equity_snapshot(future_issuances, shareholders, share_classes)

                # Calculate percentage change for shareholders
                # We need to get the "current" percentages based on current_state_data
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

        except Exception as e:
            print(f"Error in handler: {e}") # Log the error for Vercel logs
            response = jsonify({"error": str(e)}), 500
            response[0].headers.add('Access-Control-Allow-Origin', '*')
            return response
    
    return jsonify({"error": "Method Not Allowed"}), 405

# For local testing (optional, requires `python-dotenv` and `pip install python-dotenv`)
# if __name__ == '__main__':
#     from dotenv import load_dotenv
#     load_dotenv() # Load .env file for local development
#     # You might need to mock request object for local testing if not using Flask's dev server
#     # from flask import Flask
#     # app = Flask(__name__)
#     # with app.test_request_context(json={'companyId': 1, 'currentIssuances': [], 'shareholders': [], 'shareClasses': []}):
#     #     response = handler(request, None)
#     #     print(response.get_data())
