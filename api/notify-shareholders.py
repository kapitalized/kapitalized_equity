# api/notify-shareholders.py
import os
import json
from datetime import datetime
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs

# Import required libraries
try:
    from supabase import create_client, Client
    import sib_api_v3_sdk
    from sib_api_v3_sdk.rest import ApiException
    IMPORTS_AVAILABLE = True
except ImportError as e:
    IMPORTS_AVAILABLE = False
    IMPORT_ERROR = str(e)

# Initialize environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
BREVO_API_KEY = os.environ.get("BREVO_API_KEY")

# Initialize Supabase client
supabase: Client = None
if IMPORTS_AVAILABLE and SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Failed to initialize Supabase: {e}")

# Initialize Brevo API
api_instance = None
if IMPORTS_AVAILABLE and BREVO_API_KEY:
    try:
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = BREVO_API_KEY
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    except Exception as e:
        print(f"Failed to initialize Brevo: {e}")

def load_email_template():
    """Load the HTML email template with fallback"""
    fallback_template = '''
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a73e8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .issuance { background-color: white; margin: 10px 0; padding: 15px; border-left: 3px solid #34a853; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Kapitalized Equity Management</h2>
            </div>
            <div class="content">
                <p>Dear {{shareholder_name}},</p>
                <p>This email provides a summary of your current shareholdings in <strong>{{company_name}}</strong>.</p>
                
                <h3>Your Share Issuances:</h3>
                {{issuances_list_html}}

                <p>If you have any questions regarding your shareholdings, please contact us at {{contact_email}}.</p>
                <p>Sincerely,<br>The Kapitalized Team</p>
            </div>
            <div style="text-align: center; color: #777; margin-top: 20px;">
                <p>&copy; {{current_year}} Kapitalized. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    '''
    return fallback_template

def format_issuances_html(issuances):
    """Format issuances data into HTML for the email template"""
    if not issuances:
        return "<p>No share issuances found.</p>"
    
    html_parts = []
    for issuance in issuances:
        total_value = issuance.get('shares', 0) * issuance.get('price_per_share', 0)
        html_parts.append(f'''
        <div class="issuance">
            <strong>Share Class:</strong> {issuance.get('share_class_name', 'Unknown')}<br>
            <strong>Shares:</strong> {issuance.get('shares', 0):,}<br>
            <strong>Price per Share:</strong> ${issuance.get('price_per_share', 0):.2f}<br>
            <strong>Total Value:</strong> ${total_value:,.2f}<br>
            <strong>Issue Date:</strong> {issuance.get('issue_date', 'Unknown')}<br>
            <strong>Round:</strong> {issuance.get('round', 'N/A')} ({issuance.get('round_description', 'N/A')})
        </div>
        ''')
    
    return ''.join(html_parts)

def send_shareholder_email(shareholder_email, shareholder_name, company_name, issuances, contact_email="support@kapitalized.com"):
    """Send email to individual shareholder"""
    if not api_instance:
        return {"success": False, "error": "Email service not configured"}
        
    try:
        # Load and customize the email template
        template = load_email_template()
        issuances_html = format_issuances_html(issuances)
        
        # Replace template placeholders
        email_content = template.replace('{{shareholder_name}}', shareholder_name)
        email_content = email_content.replace('{{company_name}}', company_name)
        email_content = email_content.replace('{{issuances_list_html}}', issuances_html)
        email_content = email_content.replace('{{contact_email}}', contact_email)
        email_content = email_content.replace('{{current_year}}', str(datetime.now().year))
        
        # Create the email
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[sib_api_v3_sdk.SendSmtpEmailTo(email=shareholder_email, name=shareholder_name)],
            sender=sib_api_v3_sdk.SendSmtpEmailSender(email=contact_email, name="Kapitalized Team"),
            subject=f"Your Shareholding Summary - {company_name}",
            html_content=email_content
        )
        
        # Send the email
        api_response = api_instance.send_transac_email(send_smtp_email)
        return {"success": True, "message_id": api_response.message_id}
        
    except ApiException as e:
        return {"success": False, "error": f"Brevo API error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Email error: {str(e)}"}

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
            # Parse request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            company_id = request_data.get('company_id')
            shareholder_ids = request_data.get('shareholder_ids', [])
            
            # Validation
            if not company_id or not shareholder_ids:
                self.send_response(400)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {"error": "Missing company_id or shareholder_ids"}
                self.wfile.write(json.dumps(error_response).encode())
                return
            
            # Check if all services are available
            if not IMPORTS_AVAILABLE:
                self.send_response(500)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {"error": f"Required libraries not available: {IMPORT_ERROR}"}
                self.wfile.write(json.dumps(error_response).encode())
                return
            
            if not supabase:
                self.send_response(500)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {"error": "Database connection not available"}
                self.wfile.write(json.dumps(error_response).encode())
                return
            
            # Get company details
            company_response = supabase.table('companies').select('*').eq('id', company_id).single().execute()
            if not company_response.data:
                self.send_response(404)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {"error": "Company not found"}
                self.wfile.write(json.dumps(error_response).encode())
                return
            
            company = company_response.data
            company_name = company.get('name', 'Unknown Company')
            
            # Get shareholders
            shareholders_response = supabase.table('shareholders').select('*').in_('id', shareholder_ids).execute()
            shareholders = shareholders_response.data
            
            # Get share classes for this company
            share_classes_response = supabase.table('share_classes').select('*').eq('company_id', company_id).execute()
            share_classes = {sc['id']: sc for sc in share_classes_response.data}
            
            sent_count = 0
            failed_emails = []
            
            # Send emails to each selected shareholder
            for shareholder in shareholders:
                shareholder_id = shareholder['id']
                shareholder_name = shareholder.get('name', 'Unknown Shareholder')
                shareholder_email = shareholder.get('email')
                
                if not shareholder_email:
                    failed_emails.append(f"{shareholder_name} (no email address)")
                    continue
                
                # Get share issuances for this shareholder
                issuances_response = supabase.table('share_issuances').select('*').eq('company_id', company_id).eq('shareholder_id', shareholder_id).execute()
                
                # Enrich issuances with share class names
                enriched_issuances = []
                for issuance in issuances_response.data:
                    share_class_id = issuance.get('share_class_id')
                    share_class_name = share_classes.get(share_class_id, {}).get('name', 'Unknown')
                    
                    enriched_issuance = {**issuance, 'share_class_name': share_class_name}
                    enriched_issuances.append(enriched_issuance)
                
                # Send email
                result = send_shareholder_email(
                    shareholder_email=shareholder_email,
                    shareholder_name=shareholder_name,
                    company_name=company_name,
                    issuances=enriched_issuances
                )
                
                if result["success"]:
                    sent_count += 1
                else:
                    failed_emails.append(f"{shareholder_name} ({result['error']})")
            
            # Send success response
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response_message = f"Successfully sent {sent_count} email(s)"
            if failed_emails:
                response_message += f". Failed to send to: {', '.join(failed_emails)}"
            
            response_data = {
                "message": response_message,
                "sent_count": sent_count,
                "failed_count": len(failed_emails),
                "failed_emails": failed_emails
            }
            
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_response = {
                "error": f"Internal server error: {str(e)}",
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
            "endpoint": "Email notification API"
        }
        
        self.wfile.write(json.dumps(response_data).encode())
