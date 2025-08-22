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
    round: Optional[str] = None
    created_at: Optional[str] = None

class FutureIssuance(BaseModel):
    shareholderId: int
    shareClassId: int
    shares: int
    pricePerShare: float
    issueDate: str
    round: Optional[str] = 'Future Scenario'

class CalculationPayload(BaseModel):
    companyId: int
    currentIssuances: List[Issuance]
    shareholders: List[Shareholder]
    shareClasses: List[ShareClass]
    futureIssuance: Optional[FutureIssuance] = None

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
                df[col] = pd.to_numeric(df[col])

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
        "issuances": "share_issuances"
    }
    if entity not in table_map:
        raise HTTPException(status_code=404, detail="Entity not found.")

    try:
        response = supabase.from_(table_map[entity]).select('*').execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch {entity}: {e}")

# This allows Vercel to run the FastAPI app
handler = app
