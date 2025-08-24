import os
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Optional

# --- Configuration and Initialization ---

# Initialize FastAPI app
app = FastAPI()

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("CRITICAL: Supabase environment variables not set.")
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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
    round: Optional[int] = None # Changed to int
    round_description: Optional[str] = None
    payment_status: Optional[str] = None
    created_at: Optional[str] = None

class FutureIssuance(BaseModel):
    shareholderId: int
    shareClassId: int
    shares: int
    pricePerShare: float
    issueDate: str
    round: Optional[int] = None # Changed to int

class CalculationPayload(BaseModel):
    companyId: int
    currentIssuances: List[Issuance]
    shareholders: List[Shareholder]
    shareClasses: List[ShareClass]
    futureIssuance: Optional[FutureIssuance] = None

# New Pydantic model for email notification payload
class EmailNotificationPayload(BaseModel):
    company_id: str # Assuming company IDs are strings (UUIDs)
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
                df[col] = pd.to_numeric(df[col], errors='coerce') # Use coerce to handle non-numeric gracefully

    df_issuances['value'] = df_issuances['shares'] * df_issuances['price_per_share']
    total_shares = df_issuances['shares'].sum()
    total_value = df_issuances['value'].sum()

    # Create shareholder summary
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

# --- Email Sending Placeholder (Replace with Brevo/SMTP integration) ---
def send_shareholder_email(to_email: str, subject: str, body: str):
    """
    Placeholder function to send email.
    In a real application, replace this with actual Brevo/SMTP integration.
    """
    print(f"\n--- Sending Email ---")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Body:\n{body}")
    print(f"---------------------\n")
    # Example for Brevo integration (requires Brevo SDK or HTTP calls)
    # from sib_api_v3_sdk.rest import ApiException
    # from sib_api_v3_sdk import Configuration, ApiClient, TransactionalEmailsApi, SendSmtpEmail
    #
    # configuration = Configuration()
    # configuration.api_key['api-key'] = os.environ.get("BREVO_API_KEY")
    #
    # api_instance = TransactionalEmailsApi(ApiClient(configuration))
    # send_smtp_email = SendSmtpEmail(
    #     to=[{"email": to_email}],
    #     subject=subject,
    #     html_content=f"<html><body>{body.replace('\n', '<br>')}</body></html>",
    #     sender={"name": "Kapitalized", "email": "no-reply@kapitalized.com"}
    # )
    #
    # try:
    #     api_response = api_instance.send_transac_email(send_smtp_email)
    #     print(f"Brevo API response: {api_response}")
    # except ApiException as e:
    #     print(f"Exception when calling SMTPApi->send_transac_email: {e}")
    #     raise HTTPException(status_code=500, detail=f"Failed to send email via Brevo: {e}")


# --- API Endpoints ---

@app.post("/api/equity-calculator")
async def get_equity_calculation(payload: CalculationPayload):
    """Endpoint to calculate current and future equity scenarios."""
    try:
        current_issuances_dict = [issuance.dict() for issuance in payload.currentIssuances]
        shareholders_dict = [sh.dict() for sh in payload.shareholders]
        share_classes_dict = [sc.dict() for sc in payload.shareClasses]

        current_state = calculate_equity_snapshot(current_issuances_dict, shareholders_dict, share_classes_dict)
        future_state = None

        if payload.futureIssuance:
            future_issuance_dict = payload.futureIssuance.dict(by_alias=True)
            # Map frontend camelCase to Python snake_case
            future_issuance_dict['shareholder_id'] = future_issuance_dict.pop('shareholderId')
            future_issuance_dict['share_class_id'] = future_issuance_dict.pop('shareClassId')
            future_issuance_dict['price_per_share'] = future_issuance_dict.pop('pricePerShare')
            future_issuance_dict['issue_date'] = future_issuance_dict.pop('issueDate')
            # Assuming 'round' from frontend is 'roundNumber' and 'roundTitle' is 'round_description'
            future_issuance_dict['round'] = future_issuance_dict.pop('roundNumber') # Use roundNumber for round
            future_issuance_dict['round_description'] = future_issuance_dict.pop('roundTitle') # Use roundTitle for round_description
            future_issuance_dict['id'] = 999999 # Dummy ID for calculation

            all_issuances = current_issuances_dict + [future_issuance_dict]
            future_state = calculate_equity_snapshot(all_issuances, shareholders_dict, share_classes_dict)

            # Add comparison percentages
            current_percentages = {sh['id']: sh['percentage'] for sh in current_state['shareholderSummary']}
            for future_sh in future_state['shareholderSummary']:
                current_perc = current_percentages.get(future_sh['id'], 0)
                future_sh['currentPercentage'] = round(current_perc, 2)
                future_sh['futurePercentage'] = round(future_sh['percentage'], 2)
                future_sh['percentageChange'] = round(future_sh['percentage'] - current_perc, 2)

        return {"current_state": current_state, "future_state": future_state}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during calculation: {e}")

@app.get("/api/admin/{entity}")
async def get_admin_data(entity: str):
    """Endpoint to fetch all data for the admin panel."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized.")

    table_map = {
        "users": "user_profiles",
        "companies": "companies",
        "issuances": "share_issuances",
        "shareholders": "shareholders", # Added for completeness
        "shareclasses": "share_classes", # Added for completeness
    }
    if entity not in table_map:
        raise HTTPException(status_code=404, detail="Entity not found.")

    try:
        # For 'users', we need to fetch from 'auth.users' for core user data
        # and 'user_profiles' for profile data.
        if entity == "users":
            # Fetch from auth.users (requires service role key)
            auth_users_response = supabase.auth.admin.list_users()
            auth_users_data = [{"id": user.id, "email": user.email, "created_at": user.created_at} for user in auth_users_response.data.users]

            # Fetch from user_profiles
            user_profiles_response = supabase.from_('user_profiles').select('*').execute()
            user_profiles_data = user_profiles_response.data

            # Merge data, prioritizing user_profiles for display fields
            merged_users = []
            for auth_user in auth_users_data:
                profile = next((p for p in user_profiles_data if p['id'] == auth_user['id']), {})
                merged_users.append({**auth_user, **profile}) # Merge, profile data overwrites auth data if keys overlap
            return merged_users
        else:
            response = supabase.from_(table_map[entity]).select('*').execute()
            return response.data
    except Exception as e:
        print(f"Error fetching admin data for {entity}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch {entity}: {e}")

@app.delete("/api/admin/{entity}/{item_id}")
async def delete_admin_data(entity: str, item_id: str): # Changed item_id to str for UUIDs
    """Endpoint to delete data from the admin panel."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized.")

    table_map = {
        "users": "user_profiles", # Deleting a user in admin should target user_profiles
        "companies": "companies",
        "issuances": "share_issuances",
        "shareholders": "shareholders",
        "shareclasses": "share_classes",
    }
    if entity not in table_map:
        raise HTTPException(status_code=404, detail="Entity not found.")

    try:
        # Before deleting a company, delete associated issuances, shareholders, and share classes
        if entity == "companies":
            # Delete issuances associated with the company
            supabase.from_("share_issuances").delete().eq("company_id", item_id).execute()
            # Delete shareholders associated with the company
            supabase.from_("shareholders").delete().eq("company_id", item_id).execute()
            # Delete share classes associated with the company
            supabase.from_("share_classes").delete().eq("company_id", item_id).execute()
        elif entity == "users":
            # For users, delete the profile first. The auth.users record cannot be deleted from client-side.
            # The backend can delete auth.users records using the admin client.
            supabase.from_("user_profiles").delete().eq("id", item_id).execute()
            # Also delete user's companies, which will cascade to other related data
            companies_to_delete_response = supabase.from_("companies").select('id').eq('user_id', item_id).execute()
            for company in companies_to_delete_response.data:
                # Recursively call delete for company
                # Note: This recursive call will handle issuances, shareholders, shareclasses for each company
                await delete_admin_data("companies", company['id'])
            
            # Finally, delete the user from auth.users using the admin client
            supabase.auth.admin.delete_user(item_id)


        # Delete the main item if it's not a special case handled above
        if entity != "users": # Users handled above
            response = supabase.from_(table_map[entity]).delete().eq("id", item_id).execute()

            # Supabase delete operation doesn't directly return affected rows in the same way as a typical DB.
            # Check if an error occurred in the response.
            if response.data is None and response.count == 0:
                raise HTTPException(status_code=404, detail=f"No {entity} found with ID {item_id} to delete.")

        return {"message": f"{entity.capitalize()} with ID {item_id} deleted successfully."}
    except Exception as e:
        # Supabase client errors might be in response.error
        error_detail = str(e)
        # Ensure 'response' exists before trying to access its 'error' attribute
        if 'response' in locals() and hasattr(response, 'error') and response.error:
            error_detail = response.error.message
        raise HTTPException(status_code=500, detail=f"Failed to delete {entity}: {error_detail}")

@app.post("/api/notify-shareholders")
async def notify_shareholders(payload: EmailNotificationPayload):
    """
    Endpoint to send email notifications to selected shareholders.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized.")

    try:
        company_id = payload.company_id
        shareholder_ids = payload.shareholder_ids

        # Fetch company details
        company_response = supabase.from_('companies').select('*').eq('id', company_id).single().execute()
        company = company_response.data
        if not company:
            raise HTTPException(status_code=404, detail="Company not found.")

        # Fetch selected shareholders
        shareholders_response = supabase.from_('shareholders').select('*').in_('id', shareholder_ids).execute()
        selected_shareholders = shareholders_response.data
        if not selected_shareholders:
            raise HTTPException(status_code=404, detail="No selected shareholders found.")

        # Fetch all share classes for the company
        share_classes_response = supabase.from_('share_classes').select('*').eq('company_id', company_id).execute()
        share_classes_map = {sc['id']: sc['name'] for sc in share_classes_response.data}

        # Fetch all issuances for the company
        issuances_response = supabase.from_('share_issuances').select('*').eq('company_id', company_id).execute()
        all_issuances = issuances_response.data

        emails_sent_count = 0
        for shareholder in selected_shareholders:
            if not shareholder.get('email'):
                print(f"Skipping email for shareholder {shareholder['name']} (ID: {shareholder['id']}) - no email address provided.")
                continue

            # Filter issuances for the current shareholder
            shareholder_issuances = [
                iss for iss in all_issuances
                if iss['shareholder_id'] == shareholder['id']
            ]

            email_body_parts = [
                f"Dear {shareholder['name']},\n",
                f"This email provides a summary of your shareholdings in {company['name']}.\n",
                "Your Share Issuances:\n"
            ]

            if shareholder_issuances:
                for iss in shareholder_issuances:
                    share_class_name = share_classes_map.get(iss['share_class_id'], 'Unknown Class')
                    email_body_parts.append(
                        f"- Shares: {iss['shares']} of {share_class_name} at ${iss['price_per_share']:.2f} per share "
                        f"(Total Value: ${iss['shares'] * iss['price_per_share']:.2f}) "
                        f"on {iss['issue_date']} (Round: {iss.get('round_description', 'N/A')})"
                    )
            else:
                email_body_parts.append("- No share issuances recorded.")

            email_body_parts.append("\nIf you have any questions, please contact us.")
            email_body_parts.append("\nSincerely,\nThe Kapitalized Team")

            email_subject = f"Your Shareholding Summary in {company['name']}"
            email_body = "\n".join(email_body_parts)

            send_shareholder_email(shareholder['email'], email_subject, email_body)
            emails_sent_count += 1

        return {"message": f"Email notifications initiated for {emails_sent_count} shareholders."}

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in notify_shareholders endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {e}")


# This allows Vercel to run the FastAPI app
handler = app
