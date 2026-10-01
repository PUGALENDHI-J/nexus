/**
 * api/config.js
 * 
 * Vercel serverless function to securely expose Supabase credentials
 * to the frontend without hardcoding them in client code.
 * 
 * Called by: supabase.js on page load
 * 
 * Environment variables (set in Vercel Dashboard):
 *   - SUPABASE_URL
 *   - SUPABASE_ANON_KEY
 */

export default function handler(req, res) {
  // Enable CORS for same-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=60');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only return credentials if they are configured
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[API] Supabase credentials not configured in Vercel environment');
    return res.status(200).json({
      SUPABASE_URL: null,
      SUPABASE_ANON_KEY: null,
      configured: false,
    });
  }

  res.status(200).json({
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
    configured: true,
  });
}
