// ================================
// Supabase Client
// ================================

const SUPABASE_URL = "https://ndneqmmrdvfxhzfmysaq.supabase.co";
const SUPABASE_KEY = "sb_publishable_JLcX-LHik-aO4f1N7p1CFQ_wH_A5N_u";

// CDN already global `supabase` banata hai.
// Hum `sb` naam use karenge duplicate error avoid karne ke liye.
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
