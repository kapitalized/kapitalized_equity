from flask import Flask, jsonify
from supabase import create_client
import os

# Initialize Flask app
app = Flask(__name__)

# Supabase configuration (replace with your URL and key)
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)
print("Supabase client initialized in Flask backend.")

@app.route('/api/companies', methods=['GET'])
def get_companies():
    try:
        response = supabase.table('companies').select('*').execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/shareholders/<int:company_id>', methods=['GET'])
def get_shareholders(company_id):
    try:
        response = supabase.table('shareholders').select('*').eq('company_id', company_id).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
