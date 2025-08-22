# api/gemini-agent.py
import os
import json
import requests
from supabase import create_client

# This is where you would get your Gemini API key from Vercel Environment Variables
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Create a Supabase client with the service key to get full access
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase_schema():
    """
    Retrieves the full schema of the Supabase database.
    """
    try:
        tables = supabase.from_('information_schema.tables').select('table_name').eq('table_schema', 'public').execute().data
        columns = supabase.from_('information_schema.columns').select('*').eq('table_schema', 'public').execute().data
        return {"tables": tables, "columns": columns}
    except Exception as e:
        return {"error": str(e)}

def handler(request, context=None):
    if request.method != 'POST':
        return {"error": "Method Not Allowed"}, 405

    request_data = request.get_json()
    user_prompt = request_data.get('prompt')

    # This is the crucial part: Defining the tool for Gemini
    tools = [{
        "functionDeclarations": [{
            "name": "get_supabase_schema",
            "description": "Retrieves the full schema of the Supabase database, including table names and columns.",
            "parameters": {
                "type": "OBJECT",
                "properties": {},
                "required": []
            }
        }]
    }]

    # Call the Gemini API with the tool definition
    gemini_response = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key={GEMINI_API_KEY}",
        headers={"Content-Type": "application/json"},
        json={
            "contents": [{"parts": [{"text": user_prompt}]}],
            "tools": tools
        }
    ).json()

    # Process Gemini's response. If it decided to call the function...
    if "functionCall" in gemini_response:
        function_call = gemini_response["functionCall"]
        if function_call["name"] == "get_supabase_schema":
            schema = get_supabase_schema()
            # Send the schema data back to Gemini
            # (You would typically make another API call to Gemini here with the function response)
            return {"result": schema}

    # If Gemini didn't call the function, or for other responses
    return {"result": gemini_response}
