# api/supabase-schema.py
import os
import json
from supabase import create_client, Client

# Supabase client initialization using the Service Role Key
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def handler(request, context=None):
    """
    Vercel handler for API requests to get the Supabase schema.
    """
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }

    if request.method != 'GET':
        return json.dumps({"error": "Method not allowed"}), 405, headers

    try:
        if supabase is None:
            return json.dumps({"error": "Supabase client not initialized"}), 500, headers

        # Fetch all tables and views in the public schema
        tables_response = supabase.from_('information_schema.tables').select('table_name, table_type').eq('table_schema', 'public').execute()

        # Fetch column details for all tables in the public schema
        columns_response = supabase.from_('information_schema.columns').select('table_name, column_name, data_type, is_nullable, column_default').eq('table_schema', 'public').execute()

        # Organize the schema data
        schema = {
            "tables": tables_response.data,
            "columns": columns_response.data
        }

        # Use the PostgREST API to get more detailed column info for primary keys and foreign keys
        # This is often available in a dedicated Supabase view
        try:
            detailed_columns_response = supabase.from_('_postgrest_columns').select('*').execute()
            schema['detailed_columns'] = detailed_columns_response.data
        except Exception as e:
            # This table might not be available depending on Supabase version
            print(f"Could not fetch _postgrest_columns: {e}")

        return json.dumps(schema), 200, headers
    except Exception as e:
        print(f"Error in handler: {e}")
        return json.dumps({"error": f"A server error occurred: {str(e)}"}), 500, headers
