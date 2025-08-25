import os
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Optional

# Import for Brevo (uncommented)
from sib_api_v3_sdk.rest import ApiException
from sib_api_v3_sdk import Configuration, ApiClient, TransactionalEmailsApi, SendSmtpEmail

# --- Configuration and Initialization ---

# Initialize FastAPI app
app = FastAPI()

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
BREVO_API_KEY = os.environ.get("BREVO_API_KEY")

# Add diagnostic prints for environment variables
print(f"DEBUG: SUPABASE_URL read: {SUPABASE_URL}")
print(f"DEBUG: SUPABASE_KEY read: {'*' * len(SUPABASE_KEY) if SUPABASE_KEY else 'None'}") # Mask key for security
print(f"DEBUG: BREVO_API_KEY read: {'*' * len(BREVO_API_KEY) if BREVO_API_KEY else 'None'}") # Mask key for security


if not SUPABASE_URL or not SUPABASE_KEY:
    print("CRITICAL: Supabase environment variables (SUPABASE_URL or SUPABASE_KEY) not set or are empty. Supabase client will not be initialized.")
    supabase = None
else:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"DEBUG: Supabase client object type after create_client: {type(supabase)}")
        print("Supabase client initialized in FastAPI backend.")
    except Exception as e:
        print(f"CRITICAL: Failed to initialize Supabase client in FastAPI: {e}")
        supabase = None # Ensure supabase is None if initialization fails

# --- Pydantic Models for Data Validation ---
# These models ensure that the data sent from the frontend is in the correct format.

class Shareholder(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    type: Optional[str] = None

class ShareClass(BaseModel):
    id: int
    name: str
    priority: int

class Issuance(BaseModel):
    id: int
    shareholder_id: int
    share_class_id: int
    shares: int
    price_per_share: float
    issue_date: str
    round: Optional[int] = None
    round_description: Optional[str] = None
    payment_status: Optional[str] = None
    created_at: Optional[str] = None

class FutureIssuance(BaseModel):
    shareholderId: int
    shareClassId: int
    shares: int
    pricePerShare: float
    issueDate: str
    round: Optional[int] = None

class CalculationPayload(BaseModel):
    companyId: str
    currentIssuances: List[Issuance]
    shareholders: List[Shareholder]
    shareClasses: List[ShareClass]
    futureIssuance: Optional[FutureIssuance] = None

class EmailNotificationPayload(BaseModel):
    company_id: str
    shareholder_ids: List[int]

# --- Core Calculation Logic (Refactored) ---

def calculate_equity_snapshot(issuances_data: List[dict], shareholders_data: List[dict], share_classes_data: List[dict]):
    """Calculates a snapshot of equity distribution."""
    if not all([issuances_data, shareholders_data, share_classes_data]):
        return {"totalShares": 0, "totalValue": 0, "shareholderSummary": []}

    df_issuances = pd.DataFrame(issuances_data)
    df_shareholders = pd.DataFrame(shareholders_data)
    df_share_classes = pd.DataFrame(share_classes_data)

    # Ensure correct data types
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
    print(f"Body (HTML):\n{html_body[:200]}...") # Print first 200 chars to avoid clutter
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
        raise HTTPException(status_code=500, detail=f"Failed to send email via Brevo: {error_msg}")
    except Exception as e:
        error_msg = f"An unexpected error occurred during Brevo email sending: {e}"
        print(f"{error_msg}")
        raise HTTPException(status_code=500, detail=f"{error_msg}")


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
        raise HTTPException(status_code=500, detail=f"Email template '{template_name}' not found at '{template_path}'. Ensure 'api/email_templates/{template_name}.html' exists in your deployment.")
    except Exception as e:
        print(f"Error loading or rendering email template: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing email template: {e}")


# --- API Endpoints ---

@app.get("/api/health")
async def health_check():
    """
    A simple health check endpoint to verify the FastAPI backend is running.
    """
    if supabase is None:
        return {"status": "error", "message": "FastAPI backend is running, but Supabase client failed to initialize."}
    return {"status": "ok", "message": "FastAPI backend is running and Supabase client initialized."}


@app.post("/api/equity-calculator")
async def get_equity_calculation(payload: CalculationPayload):
    """Endpoint to calculate current and future equity scenarios."""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase client not initialized. Cannot perform equity calculations.")
    try:
        current_issuances_dict = [issuance.dict() for issuance in payload.currentIssuances]
        shareholders_dict = [sh.dict() for sh in payload.shareholders]
        share_classes_dict = [sc.dict() for sc in payload.shareClasses]

        current_state = calculate_equity_snapshot(current_issuances_dict, shareholders_dict, share_classes_dict)
        future_state = None

        if payload.futureIssuance:
            future_issuance_dict = payload.futureIssuance.dict(by_alias=True)
            future_issuance_dict['shareholder_id'] = future_issuance_dict.pop('shareholderId')
            future_issuance_dict['share_class_id'] = future_issuance_dict.pop('shareClassId')
            future_issuance_dict['price_per_share'] = future_issuance_dict.pop('pricePerShare')
            future_issuance_dict['issue_date'] = future_issuance_dict.pop('issueDate')
            future_issuance_dict['round'] = future_issuance_dict.pop('roundNumber')
            future_issuance_dict['round_description'] = future_issuance_dict.pop('roundTitle')
            future_issuance_dict['id'] = 999999

            all_issuances = current_issuances_dict + [future_issuance_dict]
            future_state = calculate_equity_snapshot(all_issuances, shareholders_dict, share_classes_dict)

            current_percentages = {sh['id']: sh['percentage'] for sh in current_state['shareholderSummary']}
            for future_sh in future_state['shareholderSummary']:
                current_perc = current_percentages.get(future_sh['id'], 0)
                future_sh['currentPercentage'] = round(current_perc, 2)
                future_sh['futurePercentage'] = round(future_sh['percentage'], 2)
                future_sh['percentageChange'] = round(future_sh['percentage'] - current_perc, 2)

        return {"current_state": current_state, "future_state": future_state}

    except Exception as e:
        print(f"Error in equity-calculator endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during calculation: {e}")

@app.get("/api/admin/{entity}")
async def get_admin_data(entity: str):
    """Endpoint to fetch all data for the admin panel."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized. Cannot fetch admin data.")

    table_map = {
        "users": "user_profiles",
        "companies": "companies",
        "issuances": "share_issuances",
        "shareholders": "shareholders",
        "shareclasses": "share_classes",
    }
    if entity not in table_map:
        raise HTTPException(status_code=404, detail="Entity not found.")

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
            return merged_users
        else:
            response = supabase.from_(table_map[entity]).select('*').execute()
            return response.data
    except Exception as e:
        print(f"Error fetching admin data for {entity}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch {entity}: {e}")

@app.delete("/api/admin/{entity}/{item_id}")
async def delete_admin_data(entity: str, item_id: str):
    """Endpoint to delete data from the admin panel."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized. Cannot delete admin data.")

    table_map = {
        "users": "user_profiles",
        "companies": "companies",
        "issuances": "share_issuances",
        "shareholders": "shareholders",
        "shareclasses": "share_classes",
    }
    if entity not in table_map:
        raise HTTPException(status_code=404, detail="Entity not found.")

    try:
        if entity == "companies":
            supabase.from_("share_issuances").delete().eq("company_id", item_id).execute()
            supabase.from_("shareholders").delete().eq("company_id", item_id).execute()
            supabase.from_("share_classes").delete().eq("company_id", item_id).execute()
        elif entity == "users":
            supabase.from_("user_profiles").delete().eq("id", item_id).execute()
            companies_to_delete_response = supabase.from_("companies").select('id').eq('user_id', item_id).execute()
            for company in companies_to_delete_response.data:
                await delete_admin_data("companies", company['id'])
            
            supabase.auth.admin.delete_user(item_id)

        if entity != "users":
            response = supabase.from_(table_map[entity]).delete().eq("id", item_id).execute()

            if response.data is None and response.count == 0:
                raise HTTPException(status_code=404, detail=f"No {entity} found with ID {item_id} to delete.")

        return {"message": f"{entity.capitalize()} with ID {item_id} deleted successfully."}
    except Exception as e:
        error_detail = str(e)
        if 'response' in locals() and hasattr(response, 'error') and response.error:
            error_detail = response.error.message
        print(f"Error deleting admin data for {entity} (ID: {item_id}): {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete {entity}: {error_detail}")

@app.post("/api/notify-shareholders")
async def notify_shareholders(payload: EmailNotificationPayload):
    """
    Endpoint to send email notifications to selected shareholders.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized. Cannot send email notifications.")

    try:
        company_id = payload.company_id
        shareholder_ids = payload.shareholder_ids

        company_response = supabase.from_('companies').select('*').eq('id', company_id).single().execute()
        company = company_response.data
        if not company:
            raise HTTPException(status_code=404, detail="Company not found.")

        shareholders_response = supabase.from_('shareholders').select('*').in_('id', shareholder_ids).execute()
        selected_shareholders = shareholders_response.data
        if not selected_shareholders:
            raise HTTPException(status_code=404, detail="No selected shareholders found.")

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

            except HTTPException as e:
                print(f"Error sending email to {shareholder['email']}: {e.detail}")
                raise e
            except Exception as e:
                print(f"Error sending email to {shareholder['email']}: {e}")
                raise HTTPException(status_code=500, detail=f"An internal error occurred while processing email for {shareholder['email']}: {e}")

        return {"message": f"Email notifications initiated for {emails_sent_count} shareholders."}

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in notify_shareholders endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {e}")


# This allows Vercel to run the FastAPI app
handler = app
