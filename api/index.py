from flask import Flask, jsonify, request
from supabase import create_client
import os
from datetime import datetime

app = Flask(__name__)

supabase_url = os.environ.get("SUPABASE_URL", "https://hrlqnbzcjcmrpjwnoiby.supabase.co")
supabase_key = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHFuYnpjamNtcnBqd25vaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTczODYsImV4cCI6MjA3MDk3MzM4Nn0.sOt8Gn2OpUn4dmwrBqzR2s9dzCn6GxqslRgZhlU7iiE")

def get_supabase():
    token = request.headers.get('Authorization', '').split('Bearer ')[1] if request.headers.get('Authorization') else None
    client = create_client(supabase_url, supabase_key)
    if token:
        client.auth.set_session(token, None)
    return client

# Companies, Shareholders, Share Classes (existing CRUD)
@app.route('/api/companies', methods=['GET'])
def get_companies():
    client = get_supabase()
    try:
        user = client.auth.get_user()
        response = client.table('companies').select('*').eq('user_id', user.user.id).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/companies', methods=['POST'])
def create_company():
    client = get_supabase()
    data = request.json
    try:
        user = client.auth.get_user()
        data['user_id'] = user.user.id
        response = client.table('companies').insert(data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/companies/<int:id>', methods=['PUT'])
def update_company(id):
    client = get_supabase()
    data = request.json
    try:
        user = client.auth.get_user()
        response = client.table('companies').update(data).eq('id', id).eq('user_id', user.user.id).execute()
        if not response.data:
            return jsonify({"error": "Company not found or not authorized"}), 404
        return jsonify(response.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/companies/<int:id>', methods=['DELETE'])
def delete_company(id):
    client = get_supabase()
    try:
        user = client.auth.get_user()
        response = client.table('companies').delete().eq('id', id).eq('user_id', user.user.id).execute()
        if not response.data:
            return jsonify({"error": "Company not found or not authorized"}), 404
        return jsonify({"message": "Company deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/shareholders/<int:company_id>', methods=['GET'])
def get_shareholders(company_id):
    client = get_supabase()
    try:
        user = client.auth.get_user()
        company = client.table('companies').select('id').eq('id', company_id).eq('user_id', user.user.id).execute()
        if not company.data:
            return jsonify({"error": "Company not found or not authorized"}), 404
        response = client.table('shareholders').select('*').eq('company_id', company_id).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/shareholders', methods=['POST'])
def create_shareholder():
    client = get_supabase()
    data = request.json
    try:
        user = client.auth.get_user()
        company = client.table('companies').select('id').eq('id', data['company_id']).eq('user_id', user.user.id).execute()
        if not company.data:
            return jsonify({"error": "Company not found or not authorized"}), 404
        response = client.table('shareholders').insert(data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/shareholders/<int:id>', methods=['PUT'])
def update_shareholder(id):
    client = get_supabase()
    data = request.json
    try:
        user = client.auth.get_user()
        shareholder = client.table('shareholders').select('company_id').eq('id', id).single().execute()
        if not shareholder.data:
            return jsonify({"error": "Shareholder not found"}), 404
        company = client.table('companies').select('id').eq('id', shareholder.data['company_id']).eq('user_id', user.user.id).execute()
        if not company.data:
            return jsonify({"error": "Not authorized"}), 404
        response = client.table('shareholders').update(data).eq('id', id).execute()
        return jsonify(response.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/shareholders/<int:id>', methods=['DELETE'])
def delete_shareholder(id):
    client = get_supabase()
    try:
        user = client.auth.get_user()
        shareholder = client.table('shareholders').select('company_id').eq('id', id).single().execute()
        if not shareholder.data:
            return jsonify({"error": "Shareholder not found"}), 404
        company = client.table('companies').select('id').eq('id', shareholder.data['company_id']).eq('user_id', user.user.id).execute()
        if not company.data:
            return jsonify({"error": "Not authorized"}), 404
        response = client.table('shareholders').delete().eq('id', id).execute()
        return jsonify({"message": "Shareholder deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/share_classes/<int:company_id>', methods=['GET'])
def get_share_classes(company_id):
    client = get_supabase()
    try:
        user = client.auth.get_user()
        company = client.table('companies').select('id').eq('id', company_id).eq('user_id', user.user.id).execute()
        if not company.data:
            return jsonify({"error": "Company not found or not authorized"}), 404
        response = client.table('share_classes').select('*').eq('company_id', company_id).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Equity Calculator Endpoint
@app.route('/api/equity-calculator', methods=['POST'])
def equity_calculator():
    client = get_supabase()
    data = request.json
    try:
        user = client.auth.get_user()
        company_id = data.get('company_id')
        company = client.table('companies').select('id').eq('id', company_id).eq('user_id', user.user.id).execute()
        if not company.data:
            return jsonify({"error": "Company not found or not authorized"}), 404

        # Fetch all relevant data
        shareholders = client.table('shareholders').select('*').eq('company_id', company_id).execute()
        issuances = client.table('share_issuances').select('*').eq('company_id', company_id).execute()
        share_classes = client.table('share_classes').select('*').eq('company_id', company_id).execute()

        # Simple equity calculation (expand as needed)
        equity_data = {}
        for shareholder in shareholders.data:
            total_shares = sum(i['shares'] for i in issuances.data if i['shareholder_id'] == shareholder['id'])
            equity_data[shareholder['name']] = {
                'shares': total_shares,
                'percentage': (total_shares / sum(i['shares'] for i in issuances.data)) * 100 if issuances.data else 0
            }

        return jsonify({"equity_data": equity_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Admin Endpoint
@app.route('/api/admin', methods=['POST'])
def admin_login():
    client = get_supabase()
    data = request.json
    try:
        email = data.get('email')
        password = data.get('password')
        {data: {user}, error} = client.auth.signInWithPassword({'email': email, 'password': password})
        if error:
            return jsonify({"error": error.message}), 400
        profile = client.table('user_profiles').select('is_admin').eq('id', user.id).single().execute()
        if not profile.data or not profile.data['is_admin']:
            client.auth.signOut()
            return jsonify({"error": "Not an admin"}), 403
        return jsonify({"message": "Admin login successful", "token": user.id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Notify Shareholders Endpoint
@app.route('/api/notify-shareholders', methods=['POST'])
def notify_shareholders():
    client = get_supabase()
    data = request.json
    try:
        user = client.auth.get_user()
        company_id = data.get('company_id')
        shareholder_ids = data.get('shareholder_ids', [])
        company = client.table('companies').select('id').eq('id', company_id).eq('user_id', user.user.id).execute()
        if not company.data:
            return jsonify({"error": "Company not found or not authorized"}), 404

        shareholders = client.table('shareholders').select('*').in_('id', shareholder_ids).execute()
        for shareholder in shareholders.data:
            # Placeholder for email sending (replace with actual service like SendGrid)
            subject = f"Shareholding Update for {company.data[0]['name']}"
            body = f"Dear {shareholder['name']},\nYour current shareholding details are...\n\nBest,\nEquity Manager Team"
            print(f"Would send email to {shareholder['email']}: {subject} - {body}")  # Debug print
        return jsonify({"message": f"Notifications prepared for {len(shareholders.data)} shareholders"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
