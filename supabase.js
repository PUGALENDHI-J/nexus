/**
 * ============================================================
 * supabase.js — Saran Tours & Travels
 * Supabase client + all database utility functions
 * ============================================================
 *
 * ─── QUICK SETUP ────────────────────────────────────────────
 * 1. Go to https://supabase.com → Create project
 * 2. Settings → API → copy "Project URL" and "anon public" key
 * 3. Paste them below (or use env vars for Vercel — see DEPLOYMENT.md)
 * ────────────────────────────────────────────────────────────
 */

// ─── CREDENTIALS ─────────────────────────────────────────────────────────────
// Fetch from Vercel API endpoint: /api/config
// If API fails, falls back to window._env_ or hardcoded values.
// Never commit real credentials to git — always use environment variables.

let SUPABASE_URL      = 'https://oqqreobxxxllixigwpih.supabase.co';
let SUPABASE_ANON_KEY = 'sb_publishable_ewLpd7D_W38bdpsO0A-_yw_vmVcnbgv';
let _credentialsReady = false;

/**
 * Initialize Supabase credentials from the API endpoint.
 * This must be called before getSupabase().
 */
async function initSupabaseCredentials() {
  if (_credentialsReady) return;
  
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      if (config.configured && config.SUPABASE_URL && config.SUPABASE_ANON_KEY) {
        SUPABASE_URL = config.SUPABASE_URL;
        SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;
        _credentialsReady = true;
        console.log('[Supabase] Credentials loaded from /api/config');
        return;
      }
    }
  } catch (err) {
    console.warn('[Supabase] Failed to fetch config from /api/config:', err.message);
  }

  // Fallback 1: Check window._env_ (for custom injections)
  if (window._env_?.SUPABASE_URL && window._env_?.SUPABASE_ANON_KEY) {
    SUPABASE_URL = window._env_.SUPABASE_URL;
    SUPABASE_ANON_KEY = window._env_.SUPABASE_ANON_KEY;
    _credentialsReady = true;
    console.log('[Supabase] Credentials loaded from window._env_');
    return;
  }

  // Fallback 2: Hardcoded (for local development only)
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    _credentialsReady = true;
    console.log('[Supabase] Using fallback hardcoded credentials (development only)');
    return;
  }

  console.error('[Supabase] No credentials found. Configure SUPABASE_URL and SUPABASE_ANON_KEY.');
  _credentialsReady = true;
}

// Auto-initialize on script load
initSupabaseCredentials();

// ─── CLIENT (singleton) ───────────────────────────────────────────────────────
let _client = null;

/**
 * Returns the Supabase client, creating it once on first call.
 * Depends on:
 *   1. initSupabaseCredentials() to have run
 *   2. Supabase JS CDN script being loaded before this file
 */
function getSupabase() {
  if (_client) return _client;

  // Ensure credentials are initialized
  if (!_credentialsReady) {
    console.error('[Supabase] Credentials not initialized. Call initSupabaseCredentials() first.');
    return null;
  }

  // Check if credentials are actually configured
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[Supabase] Credentials are empty. Check environment variables.');
    return null;
  }

  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.error('[Supabase] SDK not loaded. Add the CDN <script> before supabase.js.');
    return null;
  }

  _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('[Supabase] Client initialized successfully');
  return _client;
}

// ─── DEFAULT FALLBACK DATA ────────────────────────────────────────────────────
// Used when DB is unreachable (offline, unconfigured, etc.)
const DEFAULT_CABS = [
  { id: 1, name: 'Premium Hatchback', type: 'Hatchback', price: 9,  availability: 'Available', image: 'images/hatchback.png' },
  { id: 2, name: 'Executive Sedan',   type: 'Sedan',     price: 12, availability: 'Available', image: 'images/sedan.png' },
  { id: 3, name: 'Luxury SUV',        type: 'SUV',       price: 16, availability: 'Available', image: 'images/suv_premium.png' },
  { id: 4, name: 'Tempo Traveller',   type: 'Tempo',     price: 20, availability: 'Available', image: 'images/tempo.png' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CAB SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

/** Fetch all cabs, ordered by id. Falls back to DEFAULT_CABS on error. */
async function fetchCabs() {
  try {
    const db = getSupabase();
    if (!db) return DEFAULT_CABS;
    const { data, error } = await db
      .from('cab_services')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    return (data && data.length > 0) ? data : DEFAULT_CABS;
  } catch (err) {
    console.error('[DB] fetchCabs:', err.message);
    return DEFAULT_CABS;
  }
}

/** Insert a new cab. Returns the inserted row. */
async function insertCab(cab) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { data, error } = await db.from('cab_services').insert([cab]).select().single();
  if (error) throw error;
  return data;
}

/** Update a cab by id. Returns the updated row. */
async function updateCab(id, updates) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { data, error } = await db.from('cab_services').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

/** Delete a cab by id. */
async function deleteCab(id) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { error } = await db.from('cab_services').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKINGS
// ═══════════════════════════════════════════════════════════════════════════════

/** Insert a new booking. Returns the inserted row. */
async function insertBooking(booking) {
  try {
    const db = getSupabase();
    if (!db) throw new Error('Supabase not initialised');
    const payload = {
      pickup:       booking.pickup      || null,
      drop:         booking.drop        || null,
      travel_date:  booking.date        || null,
      travel_time:  booking.time        || null,
      return_date:  booking.returnDate  || null,
      car_type:     booking.carType     || null,
      passengers:   booking.passengers  || null,
      luggage:      booking.luggage     || null,
      name:         booking.name        || null,
      phone:        booking.phone       || null,
      email:        booking.email       || null,
      notes:        booking.notes       || null,
      payment:      booking.payment     || null,
      trip_type:    booking.tripType    || null,
      status:       'pending',
      created_at:   new Date().toISOString(),
    };
    const { data, error } = await db.from('bookings').insert([payload]).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[DB] insertBooking:', err.message);
    throw err;
  }
}

/** Fetch all bookings for admin dashboard, newest first. */
async function fetchBookings() {
  try {
    const db = getSupabase();
    if (!db) return [];
    const { data, error } = await db
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[DB] fetchBookings:', err.message);
    return [];
  }
}

/** Update booking status (e.g. confirmed / cancelled). */
async function updateBookingStatus(id, status) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { data, error } = await db.from('bookings').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

/** Delete a booking by id. */
async function deleteBooking(id) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { error } = await db.from('bookings').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTACT MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

/** Save a contact form submission. */
async function insertContactMessage(msg) {
  try {
    const db = getSupabase();
    if (!db) throw new Error('Supabase not initialised');
    const payload = {
      name:       msg.name    || null,
      phone:      msg.phone   || null,
      email:      msg.email   || null,
      subject:    msg.subject || null,
      message:    msg.message || null,
      is_read:    false,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await db.from('contact_messages').insert([payload]).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[DB] insertContactMessage:', err.message);
    throw err;
  }
}

/** Fetch all contact messages for admin, newest first. */
async function fetchContactMessages() {
  try {
    const db = getSupabase();
    if (!db) return [];
    const { data, error } = await db
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[DB] fetchContactMessages:', err.message);
    return [];
  }
}

/** Mark a contact message as read. */
async function markMessageRead(id) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { error } = await db.from('contact_messages').update({ is_read: true }).eq('id', id);
  if (error) throw error;
  return true;
}

/** Delete a contact message. */
async function deleteContactMessage(id) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { error } = await db.from('contact_messages').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOUR PACKAGES
// ═══════════════════════════════════════════════════════════════════════════════

/** Fetch active tour packages, ordered by sort_order. */
async function fetchTourPackages() {
  try {
    const db = getSupabase();
    if (!db) return [];
    const { data, error } = await db
      .from('tour_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[DB] fetchTourPackages:', err.message);
    return [];
  }
}

/** Fetch ALL tour packages (admin use, including inactive). */
async function fetchAllTourPackages() {
  try {
    const db = getSupabase();
    if (!db) return [];
    const { data, error } = await db
      .from('tour_packages')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[DB] fetchAllTourPackages:', err.message);
    return [];
  }
}

/** Insert a new tour package. */
async function insertTourPackage(pkg) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { data, error } = await db.from('tour_packages').insert([pkg]).select().single();
  if (error) throw error;
  return data;
}

/** Update a tour package by id. */
async function updateTourPackage(id, updates) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { data, error } = await db.from('tour_packages').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

/** Delete a tour package by id. */
async function deleteTourPackage(id) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { error } = await db.from('tour_packages').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTIMONIALS
// ═══════════════════════════════════════════════════════════════════════════════

/** Fetch active testimonials, ordered by sort_order. */
async function fetchTestimonials() {
  try {
    const db = getSupabase();
    if (!db) return [];
    const { data, error } = await db
      .from('testimonials')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[DB] fetchTestimonials:', err.message);
    return [];
  }
}

/** Fetch ALL testimonials (admin use). */
async function fetchAllTestimonials() {
  try {
    const db = getSupabase();
    if (!db) return [];
    const { data, error } = await db.from('testimonials').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[DB] fetchAllTestimonials:', err.message);
    return [];
  }
}

/** Insert a new testimonial. */
async function insertTestimonial(t) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { data, error } = await db.from('testimonials').insert([t]).select().single();
  if (error) throw error;
  return data;
}

/** Update a testimonial by id. */
async function updateTestimonial(id, updates) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { data, error } = await db.from('testimonials').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

/** Delete a testimonial by id. */
async function deleteTestimonial(id) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { error } = await db.from('testimonials').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GALLERY
// ═══════════════════════════════════════════════════════════════════════════════

/** Fetch active gallery images. */
async function fetchGallery() {
  try {
    const db = getSupabase();
    if (!db) return [];
    const { data, error } = await db.from('gallery').select('*').eq('is_active', true).order('sort_order');
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[DB] fetchGallery:', err.message);
    return [];
  }
}

/** Insert a gallery image. */
async function insertGalleryImage(img) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { data, error } = await db.from('gallery').insert([img]).select().single();
  if (error) throw error;
  return data;
}

/** Delete a gallery image by id. */
async function deleteGalleryImage(id) {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not initialised');
  const { error } = await db.from('gallery').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEBSITE CONTENT (key-value store for dynamic text)
// ═══════════════════════════════════════════════════════════════════════════════

/** Fetch a single content value by key. */
async function fetchContent(key) {
  try {
    const db = getSupabase();
    if (!db) return null;
    const { data, error } = await db.from('website_content').select('value').eq('key', key).single();
    if (error) throw error;
    return data?.value ?? null;
  } catch (err) {
    console.error(`[DB] fetchContent(${key}):`, err.message);
    return null;
  }
}

/** Fetch multiple content keys at once. Returns { key: value, ... } */
async function fetchContentBatch(keys) {
  try {
    const db = getSupabase();
    if (!db) return {};
    const { data, error } = await db.from('website_content').select('key, value').in('key', keys);
    if (error) throw error;
    const result = {};
    (data || []).forEach(row => { result[row.key] = row.value; });
    return result;
  } catch (err) {
    console.error('[DB] fetchContentBatch:', err.message);
    return {};
  }
}

/** Upsert a content key-value pair (insert or update on conflict). */
async function upsertContent(key, value) {
  try {
    const db = getSupabase();
    if (!db) throw new Error('Supabase not initialised');
    const { error } = await db
      .from('website_content')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`[DB] upsertContent(${key}):`, err.message);
    throw err;
  }
}

/** Fetch ALL content rows (for admin content editor). */
async function fetchAllContent() {
  try {
    const db = getSupabase();
    if (!db) return [];
    const { data, error } = await db.from('website_content').select('*').order('key');
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[DB] fetchAllContent:', err.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN AUTH (Supabase email/password)
// ═══════════════════════════════════════════════════════════════════════════════

/** Sign in an admin with email + password. Returns { user, session, error }. */
async function adminSignIn(email, password) {
  try {
    const db = getSupabase();
    if (!db) throw new Error('Supabase not initialised');
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { user: data.user, session: data.session, error: null };
  } catch (err) {
    console.error('[Auth] adminSignIn:', err.message);
    return { user: null, session: null, error: err.message };
  }
}

/** Sign out the current admin session. */
async function adminSignOut() {
  try {
    const db = getSupabase();
    if (db) await db.auth.signOut();
  } catch (err) {
    console.error('[Auth] adminSignOut:', err.message);
  }
}

/** Returns the current session, or null if not logged in. */
async function getAdminSession() {
  try {
    const db = getSupabase();
    if (!db) return null;
    const { data } = await db.auth.getSession();
    return data?.session ?? null;
  } catch (err) {
    console.error('[Auth] getAdminSession:', err.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REALTIME SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════════════
// NOTE: Enable Realtime for each table in Supabase Dashboard →
//       Database → Replication → toggle on the table name.

/**
 * Subscribe to cab_services changes.
 * @param {Function} onUpdate - called with fresh cabs array on any change
 * @returns Supabase channel (call unsubscribe(channel) to clean up)
 */
function subscribeToCabs(onUpdate) {
  const db = getSupabase();
  if (!db) return null;
  return db
    .channel('cab_services_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cab_services' }, async () => {
      const cabs = await fetchCabs();
      onUpdate(cabs);
    })
    .subscribe();
}

/**
 * Subscribe to bookings table changes (admin live feed).
 * @param {Function} onUpdate - called with fresh bookings array on any change
 */
function subscribeToBookings(onUpdate) {
  const db = getSupabase();
  if (!db) return null;
  return db
    .channel('bookings_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, async () => {
      const bookings = await fetchBookings();
      onUpdate(bookings);
    })
    .subscribe();
}

/**
 * Subscribe to contact_messages table changes (admin live feed).
 * @param {Function} onUpdate - called with fresh messages array on any change
 */
function subscribeToMessages(onUpdate) {
  const db = getSupabase();
  if (!db) return null;
  return db
    .channel('messages_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, async () => {
      const msgs = await fetchContactMessages();
      onUpdate(msgs);
    })
    .subscribe();
}

/** Remove a Supabase realtime channel subscription. */
function unsubscribe(channel) {
  if (channel) {
    const db = getSupabase();
    if (db) db.removeChannel(channel);
  }
}

// ─── All functions are global (no ES modules) for plain HTML/JS compatibility ─
