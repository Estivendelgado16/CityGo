from supabase import create_client, Client
from app.config import get_settings

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Singleton del cliente Supabase con service_role key (bypasea RLS)."""
    global _supabase_client
    if _supabase_client is None:
        settings = get_settings()
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,
        )
    return _supabase_client


def get_supabase_anon() -> Client:
    """Cliente con anon key (respeta RLS). Para validar tokens de usuario."""
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


