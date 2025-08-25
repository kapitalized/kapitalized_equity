from flask import Flask, jsonify, request
from supabase import create_client
import os

app = Flask(__name__)

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")

def get_supabase():
    token = request.headers.get('Authorization', '').split('Bearer ')[1] if request.headers.get('Authorization') else None
    client = create_client(supabase_url, supabase_key)
    if token:
        client.auth.set_session(token, None)  # refresh_token optional
    return client

# Companies Endpoints
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

# Shareholders Endpoints
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

# Add similar endpoints for share_classes and share_issuances (following the same pattern)

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

# Continue adding POST, PUT, DELETE for share_classes and share_issuances similarly

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
