/**
 * data-api.js
 * Centralized Supabase data fetching & realtime subscriptions
 * Replaces localStorage and mock data with live database queries
 */

class SupabaseDataAPI {
  constructor() {
    this.db = null;
    this.channels = {};
    this.initPromise = this._initialize();
  }

  // ─── INIT ──────────────────────────────────────────────────────────────────

  async _initialize() {
    try {
      await initSupabaseCredentials();
      this.db = getSupabase();
      if (this.db) {
        console.log('[DataAPI] Supabase initialized');
        return true;
      }
    } catch (err) {
      console.error('[DataAPI] Failed to initialize:', err);
    }
    return false;
  }

  /** Wait for init before any DB call */
  async ready() {
    await this.initPromise;
    if (!this.db) throw new Error('Supabase not initialized — check credentials');
  }

  // ─── CAB SERVICES ──────────────────────────────────────────────────────────

  async fetchCabs() {
    try {
      await this.ready();
      const { data, error } = await this.db
        .from('cab_services')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[DataAPI] fetchCabs:', err.message);
      return [];
    }
  }

  async insertCab(cab) {
    await this.ready();
    const { data, error } = await this.db
      .from('cab_services').insert([cab]).select().single();
    if (error) throw error;
    return data;
  }

  async updateCab(id, updates) {
    await this.ready();
    const { data, error } = await this.db
      .from('cab_services').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteCab(id) {
    await this.ready();
    const { error } = await this.db.from('cab_services').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // ─── TOUR PACKAGES ─────────────────────────────────────────────────────────

  async fetchTourPackages() {
    try {
      await this.ready();
      const { data, error } = await this.db
        .from('tour_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[DataAPI] fetchTourPackages:', err.message);
      return [];
    }
  }

  async fetchAllTourPackages() {
    try {
      await this.ready();
      const { data, error } = await this.db
        .from('tour_packages').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[DataAPI] fetchAllTourPackages:', err.message);
      return [];
    }
  }

  async insertTourPackage(pkg) {
    await this.ready();
    const { data, error } = await this.db
      .from('tour_packages').insert([pkg]).select().single();
    if (error) throw error;
    return data;
  }

  async updateTourPackage(id, updates) {
    await this.ready();
    const { data, error } = await this.db
      .from('tour_packages').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteTourPackage(id) {
    await this.ready();
    const { error } = await this.db.from('tour_packages').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // ─── TESTIMONIALS ──────────────────────────────────────────────────────────

  async fetchTestimonials() {
    try {
      await this.ready();
      const { data, error } = await this.db
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[DataAPI] fetchTestimonials:', err.message);
      return [];
    }
  }

  async fetchAllTestimonials() {
    try {
      await this.ready();
      const { data, error } = await this.db
        .from('testimonials').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[DataAPI] fetchAllTestimonials:', err.message);
      return [];
    }
  }

  async insertTestimonial(t) {
    await this.ready();
    const { data, error } = await this.db
      .from('testimonials').insert([t]).select().single();
    if (error) throw error;
    return data;
  }

  async updateTestimonial(id, updates) {
    await this.ready();
    const { data, error } = await this.db
      .from('testimonials').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteTestimonial(id) {
    await this.ready();
    const { error } = await this.db.from('testimonials').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // ─── GALLERY ───────────────────────────────────────────────────────────────

  async fetchGalleryImages() {
    try {
      await this.ready();
      const { data, error } = await this.db
        .from('gallery')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[DataAPI] fetchGalleryImages:', err.message);
      return [];
    }
  }

  async insertGalleryImage(img) {
    await this.ready();
    const { data, error } = await this.db
      .from('gallery').insert([img]).select().single();
    if (error) throw error;
    return data;
  }

  async deleteGalleryImage(id) {
    await this.ready();
    const { error } = await this.db.from('gallery').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // ─── BOOKINGS ──────────────────────────────────────────────────────────────

  async createBooking(booking) {
    try {
      await this.ready();
      const { data, error } = await this.db
        .from('bookings').insert([booking]).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[DataAPI] createBooking:', err.message);
      throw err;
    }
  }

  async fetchBookings() {
    try {
      await this.ready();
      const { data, error } = await this.db
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[DataAPI] fetchBookings:', err.message);
      return [];
    }
  }

  async updateBookingStatus(id, status) {
    await this.ready();
    const { data, error } = await this.db
      .from('bookings').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteBooking(id) {
    await this.ready();
    const { error } = await this.db.from('bookings').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // ─── CONTACT MESSAGES ──────────────────────────────────────────────────────

  async createContactMessage(msg) {
    try {
      await this.ready();
      const payload = {
        name:       msg.name    || null,
        phone:      msg.phone   || null,
        email:      msg.email   || null,
        subject:    msg.subject || null,
        message:    msg.message || null,
        is_read:    false,
        created_at: new Date().toISOString(),
      };
      const { data, error } = await this.db
        .from('contact_messages').insert([payload]).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[DataAPI] createContactMessage:', err.message);
      throw err;
    }
  }

  async fetchContactMessages() {
    try {
      await this.ready();
      const { data, error } = await this.db
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[DataAPI] fetchContactMessages:', err.message);
      return [];
    }
  }

  async markMessageRead(id) {
    await this.ready();
    const { error } = await this.db
      .from('contact_messages').update({ is_read: true }).eq('id', id);
    if (error) throw error;
    return true;
  }

  async deleteContactMessage(id) {
    await this.ready();
    const { error } = await this.db.from('contact_messages').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // ─── WEBSITE CONTENT ───────────────────────────────────────────────────────

  async fetchContent(key) {
    try {
      await this.ready();
      const { data, error } = await this.db
        .from('website_content').select('value').eq('key', key).single();
      if (error) throw error;
      return data?.value ?? null;
    } catch (err) {
      console.error(`[DataAPI] fetchContent(${key}):`, err.message);
      return null;
    }
  }

  async fetchContentBatch(keys) {
    try {
      await this.ready();
      const { data, error } = await this.db
        .from('website_content').select('key, value').in('key', keys);
      if (error) throw error;
      const result = {};
      (data || []).forEach(row => { result[row.key] = row.value; });
      return result;
    } catch (err) {
      console.error('[DataAPI] fetchContentBatch:', err.message);
      return {};
    }
  }

  async fetchAllContent() {
    try {
      await this.ready();
      const { data, error } = await this.db
        .from('website_content').select('*').order('key');
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[DataAPI] fetchAllContent:', err.message);
      return [];
    }
  }

  async upsertContent(key, value) {
    await this.ready();
    const { error } = await this.db
      .from('website_content')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
    return true;
  }

  // ─── ADMIN AUTH ────────────────────────────────────────────────────────────

  async adminSignIn(email, password) {
    try {
      await this.ready();
      const { data, error } = await this.db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { user: data.user, session: data.session, error: null };
    } catch (err) {
      console.error('[Auth] adminSignIn:', err.message);
      return { user: null, session: null, error: err.message };
    }
  }

  async adminSignOut() {
    try {
      await this.ready();
      await this.db.auth.signOut();
    } catch (err) {
      console.error('[Auth] adminSignOut:', err.message);
    }
  }

  async getAdminSession() {
    try {
      await this.ready();
      const { data } = await this.db.auth.getSession();
      return data?.session ?? null;
    } catch (err) {
      console.error('[Auth] getAdminSession:', err.message);
      return null;
    }
  }

  // ─── REALTIME SUBSCRIPTIONS ────────────────────────────────────────────────
  // Each method waits for DB init before subscribing (fixes race condition).
  // callback(eventType, newRecord, oldRecord) — eventType: 'insert'|'update'|'delete'

  async subscribeToCabs(callback) {
    try {
      await this.ready();
      if (this.channels.cabs) return this.channels.cabs;
      const channel = this.db.channel('cabs-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'cab_services' },
          async (payload) => {
            console.log('[Realtime] cab_services:', payload.eventType);
            const cabs = await this.fetchCabs();
            callback(payload.eventType.toLowerCase(), cabs);
          }
        ).subscribe((status) => {
          console.log('[Realtime] cabs subscription status:', status);
        });
      this.channels.cabs = channel;
      return channel;
    } catch (err) {
      console.error('[Realtime] subscribeToCabs failed:', err.message);
    }
  }

  async subscribeToTourPackages(callback) {
    try {
      await this.ready();
      if (this.channels.tourPackages) return this.channels.tourPackages;
      const channel = this.db.channel('tour-packages-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'tour_packages' },
          async (payload) => {
            console.log('[Realtime] tour_packages:', payload.eventType);
            const packages = await this.fetchTourPackages();
            callback(payload.eventType.toLowerCase(), packages);
          }
        ).subscribe((status) => {
          console.log('[Realtime] tour_packages subscription status:', status);
        });
      this.channels.tourPackages = channel;
      return channel;
    } catch (err) {
      console.error('[Realtime] subscribeToTourPackages failed:', err.message);
    }
  }

  async subscribeToTestimonials(callback) {
    try {
      await this.ready();
      if (this.channels.testimonials) return this.channels.testimonials;
      const channel = this.db.channel('testimonials-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'testimonials' },
          async (payload) => {
            console.log('[Realtime] testimonials:', payload.eventType);
            const testimonials = await this.fetchTestimonials();
            callback(payload.eventType.toLowerCase(), testimonials);
          }
        ).subscribe((status) => {
          console.log('[Realtime] testimonials subscription status:', status);
        });
      this.channels.testimonials = channel;
      return channel;
    } catch (err) {
      console.error('[Realtime] subscribeToTestimonials failed:', err.message);
    }
  }

  async subscribeToGallery(callback) {
    try {
      await this.ready();
      if (this.channels.gallery) return this.channels.gallery;
      const channel = this.db.channel('gallery-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'gallery' },
          async (payload) => {
            console.log('[Realtime] gallery:', payload.eventType);
            const images = await this.fetchGalleryImages();
            callback(payload.eventType.toLowerCase(), images);
          }
        ).subscribe((status) => {
          console.log('[Realtime] gallery subscription status:', status);
        });
      this.channels.gallery = channel;
      return channel;
    } catch (err) {
      console.error('[Realtime] subscribeToGallery failed:', err.message);
    }
  }

  async subscribeToBookings(callback) {
    try {
      await this.ready();
      if (this.channels.bookings) return this.channels.bookings;
      const channel = this.db.channel('bookings-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          async (payload) => {
            console.log('[Realtime] bookings:', payload.eventType);
            const bookings = await this.fetchBookings();
            callback(payload.eventType.toLowerCase(), bookings);
          }
        ).subscribe((status) => {
          console.log('[Realtime] bookings subscription status:', status);
        });
      this.channels.bookings = channel;
      return channel;
    } catch (err) {
      console.error('[Realtime] subscribeToBookings failed:', err.message);
    }
  }

  async subscribeToMessages(callback) {
    try {
      await this.ready();
      if (this.channels.messages) return this.channels.messages;
      const channel = this.db.channel('messages-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'contact_messages' },
          async (payload) => {
            console.log('[Realtime] contact_messages:', payload.eventType);
            const msgs = await this.fetchContactMessages();
            callback(payload.eventType.toLowerCase(), msgs);
          }
        ).subscribe((status) => {
          console.log('[Realtime] contact_messages subscription status:', status);
        });
      this.channels.messages = channel;
      return channel;
    } catch (err) {
      console.error('[Realtime] subscribeToMessages failed:', err.message);
    }
  }

  async subscribeToWebsiteContent(callback) {
    try {
      await this.ready();
      if (this.channels.websiteContent) return this.channels.websiteContent;
      const channel = this.db.channel('website-content-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'website_content' },
          async (payload) => {
            console.log('[Realtime] website_content:', payload.eventType, payload.new?.key);
            callback(payload.eventType.toLowerCase(), payload.new, payload.old);
          }
        ).subscribe((status) => {
          console.log('[Realtime] website_content subscription status:', status);
        });
      this.channels.websiteContent = channel;
      return channel;
    } catch (err) {
      console.error('[Realtime] subscribeToWebsiteContent failed:', err.message);
    }
  }

  // ─── CLEANUP ───────────────────────────────────────────────────────────────

  unsubscribe(channelName) {
    if (this.channels[channelName] && this.db) {
      this.db.removeChannel(this.channels[channelName]);
      delete this.channels[channelName];
      console.log('[Realtime] Unsubscribed from', channelName);
    }
  }

  cleanup() {
    Object.keys(this.channels).forEach(key => this.unsubscribe(key));
  }
}

// Singleton instance — available globally
const dataAPI = new SupabaseDataAPI();
