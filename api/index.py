from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
from supabase import create_client, Client
from functools import wraps
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("Warning: Supabase credentials not found in environment variables")
    supabase = None
else:
    supabase = create_client(supabase_url, supabase_key)

# Helper function to verify auth token
def verify_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        
        try:
            # Verify token with Supabase
            user = supabase.auth.get_user(token)
            request.current_user = user
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'supabase_connected': supabase is not None
    })

# Test endpoint
@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'message': 'API is working!'})

# Authentication endpoints
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Sign up with Supabase
        response = supabase.auth.sign_up({
            'email': email,
            'password': password
        })
        
        if response.user:
            # Create user profile
            profile_data = {
                'id': response.user.id,
                'full_name': data.get('full_name', ''),
                'dob': data.get('dob'),
                'address': data.get('address', '')
            }
            supabase.table('user_profiles').insert(profile_data).execute()
            
            return jsonify({
                'user': {
                    'id': response.user.id,
                    'email': response.user.email
                },
                'message': 'User created successfully'
            }), 201
        else:
            return jsonify({'error': 'Signup failed'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Sign in with Supabase
        response = supabase.auth.sign_in_with_password({
            'email': email,
            'password': password
        })
        
        if response.user:
            return jsonify({
                'user': {
                    'id': response.user.id,
                    'email': response.user.email
                },
                'session': {
                    'access_token': response.session.access_token if response.session else None,
                    'refresh_token': response.session.refresh_token if response.session else None
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    try:
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if auth_header:
            token = auth_header.split(' ')[1]
            supabase.auth.sign_out()
            return jsonify({'message': 'Logged out successfully'}), 200
        else:
            return jsonify({'error': 'No auth token provided'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Company endpoints
@app.route('/api/companies', methods=['GET'])
def get_companies():
    try:
        response = supabase.table('companies').select('*').execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/companies/<company_id>', methods=['GET'])
def get_company(company_id):
    try:
        response = supabase.table('companies').select('*').eq('id', company_id).execute()
        if response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({'error': 'Company not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/companies', methods=['POST'])
def create_company():
    try:
        data = request.get_json()
        
        # Validate required fields based on your schema
        required_fields = ['name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Set defaults
        company_data = {
            'company_id': data.get('company_id'),  # Your schema has company_id
            'name': data['name'],
            'priority': data.get('priority'),
            'description': data.get('description'),
            'created_at': datetime.now().isoformat()
        }
        
        # Add to Supabase
        response = supabase.table('companies').insert(company_data).execute()
        
        if response.data:
            return jsonify(response.data[0]), 201
        else:
            return jsonify({'error': 'Failed to create company'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/companies/<company_id>', methods=['PUT'])
def update_company(company_id):
    try:
        data = request.get_json()
        response = supabase.table('companies').update(data).eq('id', company_id).execute()
        
        if response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({'error': 'Company not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Shareholder endpoints
@app.route('/api/shareholders', methods=['GET'])
def get_shareholders():
    try:
        company_id = request.args.get('company_id')
        
        query = supabase.table('shareholders').select('*')
        
        if company_id:
            query = query.eq('company_id', company_id)
        
        response = query.execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shareholders/<shareholder_id>', methods=['GET'])
def get_shareholder(shareholder_id):
    try:
        response = supabase.table('shareholders').select('*').eq('id', shareholder_id).execute()
        if response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({'error': 'Shareholder not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shareholders', methods=['POST'])
def create_shareholder():
    try:
        data = request.get_json()
        
        # Validate required fields based on your schema
        required_fields = ['company_id', 'name', 'email']
        for field in required_fields:
