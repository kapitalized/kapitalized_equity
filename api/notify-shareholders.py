# api/notify-shareholders.py for emailing shareholders a summary
import os
import json
from datetime import datetime
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        """Handle POST requests"""
        try:
            # Set CORS headers
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            # Get environment variables
            brevo_key = os.environ.get("BREVO_API_KEY", "not-set")
            supabase_url = os.environ.get("SUPABASE_URL", "not-set")
            supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "not-set")
            
            # For now, just return success with environment check
            response_data = {
                "message": "API is working!",
                "timestamp": datetime.now().isoformat(),
                "environment_check": {
                    "brevo_key_set": brevo_key != "not-set",
                    "supabase_url_set": supabase_url != "not-set", 
                    "supabase_key_set": supabase_key != "not-set"
                }
            }
            
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_response = {
                "error": f"Server error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
            
            self.wfile.write(json.dumps(error_response).encode())

    def do_GET(self):
        """Handle GET requests - return method not allowed"""
        self.send_response(405)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response_data = {
            "error": "Method not allowed. Use POST.",
            "timestamp": datetime.now().isoformat()
        }
        
        self.wfile.write(json.dumps(response_data).encode())
