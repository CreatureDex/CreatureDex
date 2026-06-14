from supabase import Client, create_client

from .config import get_settings


def get_supabase() -> Client:
    """Return a Supabase client using the service-role key."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_key)