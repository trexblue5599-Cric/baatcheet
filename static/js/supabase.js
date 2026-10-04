// ================================
// Supabase Client
// ================================

const SUPABASE_URL = "https://ndneqmmrdvfxhzfmysaq.supabase.co";
const SUPABASE_KEY = "sb_publishable_JLcX-LHik-aO4f1N7p1CFQ_wH_A5N_u";

// Global variable `supabase` already CDN se aa raha hai.
// Hum usko `sb` naam se use karenge.
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
