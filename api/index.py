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
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        
        try:
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
        
        response = supabase.auth.sign_up({
            'email': email,
            'password': password
        })
        
        if response.user:
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
        
        required_fields = ['name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        company_data = {
            'name': data['name'],
            'description': data.get('description'),
            'created_at': datetime.now().isoformat()
        }
        
        # Only add company_id if provided
        if 'company_id' in data:
            company_data['company_id'] = data['company_id']
        
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
        
        required_fields = ['company_id', 'name', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        shareholder_data = {
            'company_id': data['company_id'],
            'name': data['name'],
            'email': data['email'],
            'type': data.get('type'),
            'created_at': datetime.now().isoformat()
        }
        
        response = supabase.table('shareholders').insert(shareholder_data).execute()
        
        if response.data:
            return jsonify(response.data[0]), 201
        else:
            return jsonify({'error': 'Failed to create shareholder'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shareholders/<shareholder_id>', methods=['PUT'])
def update_shareholder(shareholder_id):
    try:
        data = request.get_json()
        response = supabase.table('shareholders').update(data).eq('id', shareholder_id).execute()
        
        if response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({'error': 'Shareholder not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shareholders/<shareholder_id>', methods=['DELETE'])
def delete_shareholder(shareholder_id):
    try:
        response = supabase.table('shareholders').delete().eq('id', shareholder_id).execute()
        return jsonify({'message': 'Shareholder deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Share Classes endpoints
@app.route('/api/share-classes', methods=['GET'])
def get_share_classes():
    try:
        company_id = request.args.get('company_id')
        
        query = supabase.table('share_classes').select('*')
        
        if company_id:
            query = query.eq('company_id', company_id)
        
        response = query.execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/share-classes', methods=['POST'])
def create_share_class():
    try:
        data = request.get_json()
        
        required_fields = ['company_id', 'name', 'priority']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        share_class_data = {
            'company_id': data['company_id'],
            'name': data['name'],
            'priority': data['priority'],
            'created_at': datetime.now().isoformat()
        }
        
        response = supabase.table('share_classes').insert(share_class_data).execute()
        
        if response.data:
            return jsonify(response.data[0]), 201
        else:
            return jsonify({'error': 'Failed to create share class'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Share Issuances endpoints
@app.route('/api/share-issuances', methods=['GET'])
def get_share_issuances():
    try:
        company_id = request.args.get('company_id')
        shareholder_id = request.args.get('shareholder_id')
        
        query = supabase.table('share_issuances').select('*')
        
        if company_id:
            query = query.eq('company_id', company_id)
        if shareholder_id:
            query = query.eq('shareholder_id', shareholder_id)
        
        response = query.execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/share-issuances/<issuance_id>', methods=['GET'])
def get_share_issuance(issuance_id):
    try:
        response = supabase.table('share_issuances').select('*').eq('id', issuance_id).execute()
        if response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({'error': 'Share issuance not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/share-issuances', methods=['POST'])
def create_share_issuance():
    try:
        data = request.get_json()
        
        required_fields = ['company_id', 'shares', 'price_per_share', 'issue_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        issuance_data = {
            'company_id': data['company_id'],
            'shareholder_id': data.get('shareholder_id'),
            'share_class_id': data.get('share_class_id'),
            'shares': data['shares'],
            'price_per_share': data['price_per_share'],
            'issue_date': data['issue_date'],
            'round': data.get('round'),
            'round_description': data.get('round_description'),
            'payment_status': data.get('payment_status'),
            'created_at': datetime.now().isoformat()
        }
        
        response = supabase.table('share_issuances').insert(issuance_data).execute()
        
        if response.data:
            return jsonify(response.data[0]), 201
        else:
            return jsonify({'error': 'Failed to create share issuance'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/share-issuances/<issuance_id>', methods=['PUT'])
def update_share_issuance(issuance_id):
    try:
        data = request.get_json()
        
        response = supabase.table('share_issuances').update(data).eq('id', issuance_id).execute()
        
        if response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({'error': 'Share issuance not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/share-issuances/<issuance_id>', methods=['DELETE'])
def delete_share_issuance(issuance_id):
    try:
        response = supabase.table('share_issuances').delete().eq('id', issuance_id).execute()
        return jsonify({'message': 'Share issuance deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User profile endpoints
@app.route('/api/profile', methods=['GET'])
@verify_token
def get_profile():
    try:
        user = request.current_user
        response = supabase.table('user_profiles').select('*').eq('id', user.user.id).execute()
        
        if response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({'error': 'Profile not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['PUT'])
@verify_token
def update_profile():
    try:
        user = request.current_user
        data = request.get_json()
        
        profile_data = {
            'full_name': data.get('full_name'),
            'dob': data.get('dob'),
            'address': data.get('address')
        }
        
        response = supabase.table('user_profiles').update(profile_data).eq('id', user.user.id).execute()
        
        if response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({'error': 'Profile not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Summary endpoint - get company cap table
@app.route('/api/companies/<company_id>/cap-table', methods=['GET'])
def get_cap_table(company_id):
    try:
        issuances = supabase.table('share_issuances').select('*, shareholders(name, email)').eq('company_id', company_id).execute()
        share_classes = supabase.table('share_classes').select('*').eq('company_id', company_id).execute()
        
        total_shares = sum(item.get('shares', 0) for item in issuances.data)
        
        cap_table = {
            'company_id': company_id,
            'total_shares': total_shares,
            'share_classes': share_classes.data,
            'issuances': issuances.data,
            'shareholders': {}
        }
        
        for issuance in issuances.data:
            if issuance.get('shareholder_id'):
                shareholder_id = issuance['shareholder_id']
                if shareholder_id not in cap_table['shareholders']:
                    cap_table['shareholders'][shareholder_id] = {
                        'name': issuance.get('shareholders', {}).get('name'),
                        'email': issuance.get('shareholders', {}).get('email'),
                        'total_shares': 0,
                        'percentage': 0,
                        'issuances': []
                    }
                
                shares = issuance.get('shares', 0)
                cap_table['shareholders'][shareholder_id]['total_shares'] += shares
                cap_table['shareholders'][shareholder_id]['percentage'] = (cap_table['shareholders'][shareholder_id]['total_shares'] / total_shares * 100) if total_shares > 0 else 0
                cap_table['shareholders'][shareholder_id]['issuances'].append(issuance)
        
        return jsonify(cap_table), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Root endpoint
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'message': 'Kapitalized Equity API',
        'version': '1.0.0',
        'endpoints': [
            '/api/health',
            '/api/auth/login',
            '/api/auth/signup',
            '/api/companies',
            '/api/shareholders',
            '/api/share-classes',
            '/api/share-issuances',
            '/api/companies/{id}/cap-table',
            '/api/admin/users',
            '/api/admin/companies',
            '/api/admin/shareholders',
            '/api/admin/share-issuances'
        ]
    })

# API root
@app.route('/api', methods=['GET'])
def api_root():
    return jsonify({
        'message': 'API is running',
        'available_endpoints': [
            '/api/health',
            '/api/test',
            '/api/auth/login',
            '/api/auth/signup',
            '/api/auth/logout',
            '/api/companies',
            '/api/companies/{id}',
            '/api/companies/{id}/cap-table',
            '/api/shareholders',
            '/api/shareholders/{id}',
            '/api/share-classes',
            '/api/share-issuances',
            '/api/share-issuances/{id}',
            '/api/profile',
            '/api/admin/users',
            '/api/admin/companies',
            '/api/admin/shareholders',
            '/api/admin/share-issuances'
        ]
    })

# Test data endpoint
@app.route('/api/test-data', methods=['POST'])
def create_test_data():
    try:
        company_response = supabase.table('companies').insert({
            'name': 'Test Startup Inc',
            'description': 'A test company for demonstration'
        }).execute()
        
        if not company_response.data:
            return jsonify({'error': 'Failed to create test company'}), 400
            
        company_id = company_response.data[0]['id']
        
        ordinary_shares = supabase.table('share_classes').insert({
            'company_id': company_id,
            'name': 'Ordinary Shares',
            'priority': 1
        }).execute()
        
        preference_shares = supabase.table('share_classes').insert({
            'company_id': company_id,
            'name': 'Preference Shares',
            'priority': 2
        }).execute()
        
        shareholder1 = supabase.table('shareholders').insert({
            'company_id': company_id,
            'name': 'John Founder',
            'email': 'john@example.com',
            'type': 'individual'
        }).execute()
        
        shareholder2 = supabase.table('shareholders').insert({
            'company_id': company_id,
            'name': 'Jane Investor',
            'email': 'jane@example.com',
            'type': 'individual'
        }).execute()
        
        shareholder3 = supabase.table('shareholders').insert({
            'company_id': company_id,
            'name': 'Venture Capital LLC',
            'email': 'vc@example.com',
            'type': 'company'
        }).execute()
        
        if shareholder1.data and ordinary_shares.data:
            supabase.table('share_issuances').insert({
                'company_id': company_id,
                'shareholder_id': shareholder1.data[0]['id'],
                'share_class_id': ordinary_shares.data[0]['id'],
                'shares': 1000000,
                'price_per_share': 0.001,
                'issue_date': '2024-01-01',
                'round': 1
            }).execute()
        
        if shareholder2.data and ordinary_shares.data:
            supabase.table('share_issuances').insert({
                'company_id': company_id,
                'shareholder_id': shareholder2.data[0]['id'],
                'share_class_id': ordinary_shares.data[0]['id'],
                'shares': 200000,
                'price_per_share': 1.0,
                'issue_date': '2024-06-01',
                'round': 2
            }).execute()
        
        if shareholder3.data and preference_shares.data:
            supabase.table('share_issuances').insert({
                'company_id': company_id,
                'shareholder_id': shareholder3.data[0]['id'],
                'share_class_id': preference_shares.data[0]['id'],
                'shares': 500000,
                'price_per_share': 5.0,
                'issue_date': '2024-12-01',
                'round': 3
            }).execute()
        
        return jsonify({
            'message': 'Test data created successfully',
            'company_id': company_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e), 'type': 'exception'}), 500

# Admin endpoints
@app.route('/api/admin/users', methods=['GET'])
def get_admin_users():
    try:
        response = supabase.table('user_profiles').select('*').execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e), 'message': 'Failed to fetch users'}), 500

@app.route('/api/admin/companies', methods=['GET'])
def get_admin_companies():
    try:
        response = supabase.table('companies').select('*').execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e), 'message': 'Failed to fetch companies'}), 500

@app.route('/api/admin/shareholders', methods=['GET'])
def get_admin_shareholders():
    try:
        response = supabase.table('shareholders').select('*').execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e), 'message': 'Failed to fetch shareholders'}), 500

@app.route('/api/admin/share-issuances', methods=['GET'])
def get_admin_share_issuances():
    try:
        response = supabase.table('share_issuances').select('*').execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e), 'message': 'Failed to fetch share issuances'}), 500

# Add this endpoint (the admin panel is looking for "issuances" not "share-issuances")
@app.route('/api/admin/issuances', methods=['GET'])
def get_admin_issuances_alias():
    try:
        response = supabase.table('share_issuances').select('*').execute()
        # Convert IDs to strings to fix the substring error
        for item in response.data:
            for key in ['id', 'company_id', 'shareholder_id', 'share_class_id']:
                if key in item and item[key] is not None:
                    item[key] = str(item[key])
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Admin delete endpoints
@app.route('/api/admin/companies/<company_id>', methods=['DELETE'])
def delete_admin_company(company_id):
    try:
        # Delete related data first
        supabase.table('share_issuances').delete().eq('company_id', company_id).execute()
        supabase.table('shareholders').delete().eq('company_id', company_id).execute()
        supabase.table('share_classes').delete().eq('company_id', company_id).execute()
        supabase.table('companies').delete().eq('id', company_id).execute()
        return jsonify({'message': 'Company deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/shareholders/<shareholder_id>', methods=['DELETE'])
def delete_admin_shareholder(shareholder_id):
    try:
        supabase.table('share_issuances').delete().eq('shareholder_id', shareholder_id).execute()
        supabase.table('shareholders').delete().eq('id', shareholder_id).execute()
        return jsonify({'message': 'Shareholder deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/share-issuances/<issuance_id>', methods=['DELETE'])
def delete_admin_share_issuance(issuance_id):
    try:
        supabase.table('share_issuances').delete().eq('id', issuance_id).execute()
        return jsonify({'message': 'Share issuance deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# This MUST be at the very end of the file
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
