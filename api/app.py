import os
import pandas as pd
from datetime import datetime
from flask import Flask, request, jsonify
from supabase import create_client, Client
from sib_api_v3_sdk.rest import ApiException
from sib_api_v3_sdk import Configuration, ApiClient, TransactionalEmailsApi, SendSmtpEmail
from functools import wraps

# --- Configuration and Initialization ---

# Initialize Flask app
app = Flask(__name__)

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
BREVO_API_KEY = os.environ.get("BREVO_API_KEY")

supabase = None
if not SUPABASE_URL or not SUPABASE_KEY:
    print("CRITICAL: Supabase environment variables (SUPABASE_URL or SUPABASE_KEY) not set or are empty.")
else:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Supabase client initialized in Flask backend.")
    except Exception as e:
        print(f"CRITICAL: Failed to initialize Supabase client in Flask: {e}")
        supabase = None

# Decorator to check if Supabase is initialized
def require_supabase(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if supabase is None:
            return jsonify({"detail": "Supabase client not initialized."}), 500
        return f(*args, **kwargs)
    return decorated_function

# --- Core Calculation Logic ---

def calculate_equity_snapshot(issuances_data: List[dict], shareholders_data: List[dict], share_classes_data: List[dict]):
    """Calculates a snapshot of equity distribution."""
    if not all([issuances_data, shareholders_data, share_classes_data]):
        return {"totalShares": 0, "totalValue": 0, "shareholderSummary": []}

    df_issuances = pd.DataFrame(issuances_data)
    df_shareholders = pd.DataFrame(shareholders_data)
    df_share_classes = pd.DataFrame(share_classes_data)

    for df in [df_issuances, df_shareholders, df_share_classes]:
        for col in ['id', 'shareholder_id', 'share_class_id']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

    df_issuances['value'] = df_issuances['shares'] * df_issuances['price_per_share']
    total_shares = df_issuances['shares'].sum()
    total_value = df_issuances['value'].sum()

    summary = df_issuances.groupby('shareholder_id').agg(
        totalShares=('shares', 'sum'),
        totalValue=('value', 'sum')
    ).reset_index()

    summary = summary.merge(df_shareholders[['id', 'name']], left_on='shareholder_id', right_on='id')

    if total_shares > 0:
        summary['percentage'] = (summary['totalShares'] / total_shares) * 100
    else:
        summary['percentage'] = 0

    return {
        "totalShares": int(total_shares),
        "totalValue": float(total_value),
        "shareholderSummary": summary.to_dict('records')
    }

# --- Email Sending Integration (Brevo) ---
def send_shareholder_email(to_email: str, subject: str, html_body: str):
    """
    Sends an email using Brevo (Sendinblue) API.
    Requires BREVO_API_KEY environment variable to be set.
    """
    print(f"\n--- Attempting to Send Email via Brevo ---")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Body (HTML):\n{html_body[:200]}...")
    print(f"-----------------------------------------\n")

    if not BREVO_API_KEY:
        print("WARNING: BREVO_API_KEY not set. Cannot send actual emails via Brevo.")
        return {"status": "error", "message": "Brevo API key not configured."}

    configuration = Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY

    api_instance = TransactionalEmailsApi(ApiClient(configuration))
    send_smtp_email = SendSmtpEmail(
        to=[{"email": to_email}],
        subject=subject,
        html_content=html_body,
        sender={"name": "Kapitalized", "email": "no-reply@kapitalized.com"} # IMPORTANT: Replace with your VERIFIED sender email in Brevo
    )

    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Brevo API response: {api_response}")
        return {"status": "success", "message": "Email sent successfully via Brevo."}
    except ApiException as e:
        error_msg = f"Brevo API Exception: {e.reason} - {e.body}"
        print(f"Exception when calling SMTPApi->send_transac_email: {error_msg}")
        raise Exception(f"Failed to send email via Brevo: {error_msg}") # Raise generic exception for Flask to catch
    except Exception as e:
        error_msg = f"An unexpected error occurred during Brevo email sending: {e}"
        print(f"{error_msg}")
        raise Exception(f"{error_msg}")


def load_email_template(template_name: str, context: dict) -> str:
    """
    Loads an HTML email template and renders it with provided context.
    """
    template_path = os.path.join(os.path.dirname(__file__), "email_templates", f"{template_name}.html")
    print(f"Attempting to load email template from: {template_path}")
    try:
        with open(template_path, "r") as f:
            template_content = f.read()
        
        for key, value in context.items():
            template_content = template_content.replace(f"{{{key}}}", str(value))
        return template_content
    except FileNotFoundError:
        print(f"Email template {template_name}.html not found at {template_path}")
        raise Exception(f"Email template '{template_name}' not found at '{template_path}'. Ensure 'api/email_templates/{template_name}.html' exists in your deployment.")
    except Exception as e:
        print(f"Error loading or rendering email template: {e}")
        raise Exception(f"Error processing email template: {e}")


# --- API Endpoints ---

# Health Check Endpoint
@app.route("/api/health", methods=['GET'])
@require_supabase
def health_check():
    """
    A simple health check endpoint to verify the Flask backend is running.
    """
    return jsonify({"status": "ok", "message": "Flask backend is running and Supabase client initialized."})


@app.route("/api/equity-calculator", methods=['POST'])
@require_supabase
def get_equity_calculation():
    """Endpoint to calculate current and future equity scenarios."""
    try:
        payload = request.get_json()
        
        # Manually parse payload to Pydantic-like objects for calculation logic
        current_issuances_data = [Issuance(**i) for i in payload.get('currentIssuances', [])]
        shareholders_data = [Shareholder(**s) for s in payload.get('shareholders', [])]
        share_classes_data = [ShareClass(**sc) for sc in payload.get('shareClasses', [])]
        
        current_state = calculate_equity_snapshot(
            [i.dict() for i in current_issuances_data],
            [s.dict() for s in shareholders_data],
            [sc.dict() for sc in share_classes_data]
        )
        future_state = None

        if payload.get('futureIssuance'):
            future_issuance_payload = payload['futureIssuance']
            future_issuance_dict = {
                'shareholder_id': future_issuance_payload.get('shareholderId'),
                'share_class_id': future_issuance_payload.get('shareClassId'),
                'shares': future_issuance_payload.get('shares'),
                'price_per_share': future_issuance_payload.get('pricePerShare'),
                'issue_date': future_issuance_payload.get('issueDate'),
                'round': future_issuance_payload.get('roundNumber'),
                'round_description': future_issuance_payload.get('roundTitle'),
                'id': 999999 # Dummy ID for calculation
            }
            # Ensure round is int if present
            if future_issuance_dict['round'] is not None:
                future_issuance_dict['round'] = int(future_issuance_dict['round'])

            all_issuances_for_future = [i.dict() for i in current_issuances_data] + [future_issuance_dict]
            future_state = calculate_equity_snapshot(
                all_issuances_for_future,
                [s.dict() for s in shareholders_data],
                [sc.dict() for sc in share_classes_data]
            )

            current_percentages = {sh['id']: sh['percentage'] for sh in current_state['shareholderSummary']}
            for future_sh in future_state['shareholderSummary']:
                current_perc = current_percentages.get(future_sh['id'], 0)
                future_sh['currentPercentage'] = round(current_perc, 2)
                future_sh['futurePercentage'] = round(future_sh['percentage'], 2)
                future_sh['percentageChange'] = round(future_sh['percentage'] - current_perc, 2)

        return jsonify({"current_state": current_state, "future_state": future_state})

    except Exception as e:
        print(f"Error in equity-calculator endpoint: {e}")
        return jsonify({"detail": f"An error occurred during calculation: {e}"}), 500

@app.route("/api/admin/<entity>", methods=['GET'])
@require_supabase
def get_admin_data(entity: str):
    """Endpoint to fetch all data for the admin panel."""
    table_map = {
        "users": "user_profiles",
        "companies": "companies",
        "issuances": "share_issuances",
        "shareholders": "shareholders",
        "shareclasses": "share_classes",
    }
    if entity not in table_map:
        return jsonify({"detail": "Entity not found."}), 404

    try:
        if entity == "users":
            auth_users_response = supabase.auth.admin.list_users()
            auth_users_data = [{"id": user.id, "email": user.email, "created_at": user.created_at} for user in auth_users_response.data.users]

            user_profiles_response = supabase.from_('user_profiles').select('*').execute()
            user_profiles_data = user_profiles_response.data

            merged_users = []
            for auth_user in auth_users_data:
                profile = next((p for p in user_profiles_data if p['id'] == auth_user['id']), {})
                merged_users.append({**auth_user, **profile})
            return jsonify(merged_users)
        else:
            response = supabase.from_(table_map[entity]).select('*').execute()
            return jsonify(response.data)
    except Exception as e:
        print(f"Error fetching admin data for {entity}: {e}")
        return jsonify({"detail": f"Failed to fetch {entity}: {e}"}), 500

@app.route("/api/admin/<entity>/<item_id>", methods=['DELETE'])
@require_supabase
def delete_admin_data(entity: str, item_id: str):
    """Endpoint to delete data from the admin panel."""
    table_map = {
        "users": "user_profiles",
        "companies": "companies",
        "issuances": "share_issuances",
        "shareholders": "shareholders",
        "shareclasses": "share_classes",
    }
    if entity not in table_map:
        return jsonify({"detail": "Entity not found."}), 404

    try:
        if entity == "companies":
            supabase.from_("share_issuances").delete().eq("company_id", item_id).execute()
            supabase.from_("shareholders").delete().eq("company_id", item_id).execute()
            supabase.from_("share_classes").delete().eq("company_id", item_id).execute()
        elif entity == "users":
            supabase.from_("user_profiles").delete().eq("id", item_id).execute()
            companies_to_delete_response = supabase.from_("companies").select('id').eq('user_id', item_id).execute()
            for company in companies_to_delete_response.data:
                # Flask routes cannot be directly called with await from within a route,
                # but we can call the underlying function if it doesn't rely on request context
                # For simplicity, if this causes issues, consider moving cascade logic to Supabase RLS or a separate utility function.
                # For now, we'll call the underlying function directly.
                _delete_company_cascade(company['id']) # Helper to avoid recursive route call
            
            supabase.auth.admin.delete_user(item_id)

        if entity != "users":
            response = supabase.from_(table_map[entity]).delete().eq("id", item_id).execute()

            if response.data is None and response.count == 0:
                return jsonify({"detail": f"No {entity} found with ID {item_id} to delete."}), 404

        return jsonify({"message": f"{entity.capitalize()} with ID {item_id} deleted successfully."})
    except Exception as e:
        error_detail = str(e)
        print(f"Error deleting admin data for {entity} (ID: {item_id}): {e}")
        return jsonify({"detail": f"Failed to delete {entity}: {error_detail}"}), 500

# Helper function for cascading company delete (called from delete_admin_data)
def _delete_company_cascade(company_id: str):
    if supabase is None:
        raise Exception("Supabase client not initialized for cascade delete.")
    supabase.from_("share_issuances").delete().eq("company_id", company_id).execute()
    supabase.from_("shareholders").delete().eq("company_id", company_id).execute()
    supabase.from_("share_classes").delete().eq("company_id", company_id).execute()


@app.route("/api/notify-shareholders", methods=['POST'])
@require_supabase
def notify_shareholders():
    """
    Endpoint to send email notifications to selected shareholders.
    """
    try:
        payload = request.get_json()
        company_id = payload.get('company_id')
        shareholder_ids = payload.get('shareholder_ids')

        if not company_id or not shareholder_ids:
            return jsonify({"detail": "Missing company_id or shareholder_ids in payload."}), 400

        company_response = supabase.from_('companies').select('*').eq('id', company_id).single().execute()
        company = company_response.data
        if not company:
            return jsonify({"detail": "Company not found."}), 404

        shareholders_response = supabase.from_('shareholders').select('*').in_('id', shareholder_ids).execute()
        selected_shareholders = shareholders_response.data
        if not selected_shareholders:
            return jsonify({"detail": "No selected shareholders found."}), 404

        share_classes_response = supabase.from_('share_classes').select('*').eq('company_id', company_id).execute()
        share_classes_map = {sc['id']: sc['name'] for sc in share_classes_response.data}

        issuances_response = supabase.from_('share_issuances').select('*').eq('company_id', company_id).execute()
        all_issuances = issuances_response.data

        emails_sent_count = 0
        for shareholder in selected_shareholders:
            if not shareholder.get('email'):
                print(f"Skipping email for shareholder {shareholder['name']} (ID: {shareholder['id']}) - no email address provided.")
                continue

            shareholder_issuances = [
                iss for iss in all_issuances
                if iss['shareholder_id'] == shareholder['id']
            ]

            issuances_html = ""
            if shareholder_issuances:
                for iss in shareholder_issuances:
                    share_class_name = share_classes_map.get(iss['share_class_id'], 'Unknown Class')
                    issuances_html += f"""
                        <li>
                            <strong>Shares:</strong> {iss['shares']} of {share_class_name} <br/>
                            <strong>Price per Share:</strong> ${iss['price_per_share']:.2f} <br/>
                            <strong>Total Value:</strong> ${iss['shares'] * iss['price_per_share']:.2f} <br/>
                            <strong>Issue Date:</strong> {iss['issue_date']} <br/>
                            <strong>Round:</strong> {iss.get('round_description', 'N/A')}
                        </li>
                    """
            else:
                issuances_html = "<li>No share issuances recorded.</li>"

            template_context = {
                "shareholder_name": shareholder['name'],
                "company_name": company['name'],
                "issuances_list_html": f"<ul>{issuances_html}</ul>",
                "contact_email": "support@kapitalized.com",
                "current_year": datetime.now().year
            }

            email_subject = f"Your Shareholding Summary in {company['name']}"
            
            try:
                html_content = load_email_template("shareholder_notification", template_context)
                
                send_result = send_shareholder_email(shareholder['email'], email_subject, html_content)
                if send_result and send_result.get("status") == "success":
                    emails_sent_count += 1
                else:
                    print(f"Email sending failed for {shareholder['email']}: {send_result.get('message', 'Unknown error')}")

            except Exception as e: # Catch any exception during email sending/template loading
                print(f"Error sending email to {shareholder['email']}: {e}")
                # Do not re-raise, allow other emails to attempt sending
                # Or, if critical, re-raise as HTTPException
                # raise HTTPException(status_code=500, detail=f"Failed to send email to {shareholder['email']}: {e}")

        return jsonify({"message": f"Email notifications initiated for {emails_sent_count} shareholders."})

    except Exception as e:
        print(f"Error in notify-shareholders endpoint: {e}")
        return jsonify({"detail": f"An internal server error occurred: {e}"}), 500

# This is the entry point for Vercel for Flask applications
handler = app
