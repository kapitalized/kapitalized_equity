# python-backend/main.py

import os
from flask import Flask, request, jsonify
from supabase import create_client, Client
import pandas as pd
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)

# Supabase client initialization
# IMPORTANT: These should be set as environment variables in your Google Cloud Function
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role Key for backend security

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase URL and Key must be set as environment variables.")

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
        share_class = df_share_classes[df_share_classes['id'] == row['share_class_id']].iloc[0]
        percentage = (row['totalShares'] / total_shares * 100) if total_shares > 0 else 0
        
        # Determine the round for the class summary (can be complex if a class has multiple rounds)
        # For simplicity, we'll just take the round from the first issuance in that class group
        # A more robust solution might involve grouping by (share_class_id, round)
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
        shareholder = df_shareholders[df_shareholders['id'] == shareholder_id].iloc[0]
        total_shares_sh = group['shares'].sum()
        total_value_sh = group['value'].sum()
        
        holdings = []
        for _, issuance in group.iterrows():
            share_class = df_share_classes[df_share_classes['id'] == issuance['share_class_id']].iloc[0]
            holdings.append({
                "id": int(issuance['id']),
                "shares": int(issuance['shares']),
                "price_per_share": float(issuance['price_per_share']),
                "issue_date": issuance['issue_date'].strftime('%Y-%m-%d'),
                "shareClassName": share_class['name'],
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

# --- API Endpoint ---
@app.route('/calculate-equity', methods=['POST'])
def calculate_equity():
    try:
        data = request.get_json()
        company_id = data.get('companyId')
        future_issuance = data.get('futureIssuance')
        
        if not company_id:
            return jsonify({"error": "companyId is required"}), 400

        # Fetch current data for the company
        # Using Supabase Python client to fetch data
        # Note: Ensure your Supabase RLS policies allow the SERVICE_ROLE_KEY to read these tables
        response_issuances = supabase.from('share_issuances').select('*').eq('company_id', company_id).execute()
        response_shareholders = supabase.from('shareholders').select('*').eq('company_id', company_id).execute()
        response_share_classes = supabase.from('share_classes').select('*').eq('company_id', company_id).execute()

        current_issuances = response_issuances.data if response_issuances.data else []
        shareholders = response_shareholders.data if response_shareholders.data else []
        share_classes = response_share_classes.data if response_share_classes.data else []

        # Calculate current state
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
                "round": future_issuance['round'] or 'Future Scenario'
            }
            future_issuances.append(future_issuance_processed)
            
            future_state_data = calculate_equity_snapshot(future_issuances, shareholders, share_classes)

            # Calculate percentage change for shareholders
            for sh_future in future_state_data['shareholderSummary']:
                sh_current = next((sh for sh in current_state_data['shareholderSummary'] if sh['id'] == sh_future['id']), None)
                if sh_current:
                    current_percentage = (sh_current['totalShares'] / current_state_data['totalShares'] * 100) if current_state_data['totalShares'] > 0 else 0
                    future_percentage = (sh_future['totalShares'] / future_state_data['totalShares'] * 100) if future_state_data['totalShares'] > 0 else 0
                    
                    sh_future['percentageChange'] = round(future_percentage - current_percentage, 2)
                    sh_future['currentPercentage'] = round(current_percentage, 2)
                    sh_future['futurePercentage'] = round(future_percentage, 2)
                else:
                    # New shareholder in future scenario
                    future_percentage = (sh_future['totalShares'] / future_state_data['totalShares'] * 100) if future_state_data['totalShares'] > 0 else 0
                    sh_future['percentageChange'] = round(future_percentage, 2) # New shareholder, 0% current
                    sh_future['currentPercentage'] = 0
                    sh_future['futurePercentage'] = round(future_percentage, 2)

        return jsonify({
            "current_state": current_state_data,
            "future_state": future_state_data
        }), 200

    except Exception as e:
        app.logger.error(f"Error in calculate_equity: {e}")
        return jsonify({"error": str(e)}), 500

# Entry point for Google Cloud Functions
def equity_calculator(request):
    """
    HTTP Cloud Function entry point.
    """
    # Set CORS headers for preflight requests
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # Set CORS headers for main requests
    headers = {
        'Access-Control-Allow-Origin': '*'
    }
    response = app.full_dispatch_request()
    return (response.get_data(), response.status_code, headers)
