/* Saran Tours & Travels — Global Logic */

// Google Places Autocomplete
function initAutocomplete() {
  const inputs = ['pickup', 'drop', 'booking-pickup', 'booking-drop'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el && typeof google !== 'undefined' && google.maps && google.maps.places) {
      try {
        const autocomplete = new google.maps.places.Autocomplete(el, {
          componentRestrictions: { country: 'in' },
          fields: ['address_components', 'geometry', 'name'],
          types: ['geocode']
        });
        autocomplete.addListener('place_changed', updateEstimate);
      } catch (e) {
        console.warn('Google Maps Autocomplete failed:', id, e);
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CABS — fetch from Supabase, render, subscribe to realtime
// ═══════════════════════════════════════════════════════════════════════════

let cachedCabs = [];

async function loadCabs() {
  try {
    const cabs = await dataAPI.fetchCabs();
    cachedCabs = cabs;
    renderCabOptions();
    return cabs;
  } catch (err) {
    console.error('[Script] loadCabs failed:', err);
    cachedCabs = [];
  }
}

function getCabs() { return cachedCabs; }

function renderCabOptions() {
  const cabs = getCabs();

  // Populate car-type dropdowns
  document.querySelectorAll('#car-type, #booking-car-type').forEach(dropdown => {
    if (!dropdown) return;
    const currentValue = dropdown.value;
    dropdown.innerHTML = '<option value="">Select car</option>' +
      cabs.map(cab =>
        `<option value="${cab.type.toLowerCase()}">${cab.name} (₹${cab.price}/km)</option>`
      ).join('');
    dropdown.value = currentValue;
  });

  // Populate booking page car-select grid
  const grid = document.querySelector('.car-select-grid');
  if (grid) {
    grid.innerHTML = cabs.map((cab, idx) => {
      const imgSrc = cab.image ? cab.image.replace('../', '') : 'images/sedan.png';
      const capacity = cab.type === 'SUV' ? 6 : cab.type === 'Tempo' ? 12 : 4;
      return `
        <div class="car-option ${idx === 0 ? 'selected' : ''}" data-car="${cab.type.toLowerCase()}" data-id="${cab.id}">
          <div class="car-option-icon"><img src="${imgSrc}" alt="${cab.type}" onerror="this.src='images/sedan.png'"></div>
          <div class="car-option-name">${cab.name}</div>
          <div class="car-option-cap">Up to ${capacity} | ₹${cab.price}/km</div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.car-option').forEach(opt => {
      opt.onclick = () => {
        document.querySelectorAll('.car-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        updateEstimate();
      };
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// NAVBAR / LOADER / REVEAL
// ═══════════════════════════════════════════════════════════════════════════

function initMobileMenu() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.querySelector('.nav-menu');
  if (navToggle && navMenu) {
    navToggle.onclick = (e) => {
      e.stopPropagation();
      navToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    };
    document.querySelectorAll('.nav-link').forEach(link => {
      link.onclick = () => {
        navToggle.classList.remove('open');
        navMenu.classList.remove('open');
      };
    });
  }
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.classList.add('hide');
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function initCounters() {
  const counters = document.querySelectorAll('.stat-num');
  const animate = (counter) => {
    const target = +counter.getAttribute('data-target');
    const suffix = counter.getAttribute('data-suffix') || '';
    const speed = 2000;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const val = Math.min(Math.floor((progress / speed) * target), target);
      counter.innerText = val.toLocaleString() + suffix;
      if (val < target) requestAnimationFrame(step);
      else counter.innerText = target.toLocaleString() + suffix;
    };
    requestAnimationFrame(step);
  };
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  counters.forEach(c => counterObserver.observe(c));
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE INIT
// ═══════════════════════════════════════════════════════════════════════════

window.addEventListener('load', async () => {
  setTimeout(hideLoader, 100);
  setTimeout(initReveal, 200);

  if (typeof dataAPI !== 'undefined') {
    // Load cabs from Supabase (no localStorage, always fresh)
    await loadCabs();

    // Realtime: auto-refresh cab options on any cab change
    dataAPI.subscribeToCabs((_eventType, freshCabs) => {
      cachedCabs = freshCabs;
      renderCabOptions();
      updateEstimate();
    });
  } else {
    console.warn('[Script] dataAPI is not defined. Skipping dynamic cab loading.');
  }

  initMobileMenu();
  initCounters();
  if (typeof AOS !== 'undefined') AOS.refresh();
});

// Fallback loader hide
setTimeout(hideLoader, 2000);

// Navbar scroll effect
window.onscroll = () => {
  const nav = document.querySelector('.navbar');
  if (nav) {
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
};

function updateEstimate() {
  const distEl = document.getElementById('fare-distance');
  if (distEl) distEl.innerText = 'Calculating...';
}

// ═══════════════════════════════════════════════════════════════════════════
// TRIP TYPE TOGGLE
// ═══════════════════════════════════════════════════════════════════════════

document.querySelectorAll('.trip-btn').forEach(btn => {
  btn.onclick = () => {
    const type = btn.dataset.trip;
    document.querySelectorAll(`.trip-btn[data-trip="${type}"]`).forEach(b => b.classList.add('active'));
    document.querySelectorAll(`.trip-btn:not([data-trip="${type}"])`).forEach(b => b.classList.remove('active'));

    const card = btn.closest('.booking-card') || btn.closest('.booking-full-card');
    if (card) {
      card.setAttribute('data-trip-type', type);
      const dropInput = card.querySelector('#drop, #booking-drop');
      if (dropInput) {
        if (type === 'local') {
          dropInput.required = false;
          dropInput.placeholder = 'Enter drop (Optional for Local)';
          if (!dropInput.value) dropInput.value = 'Local Trip';
        } else {
          dropInput.required = true;
          dropInput.placeholder = 'Enter drop city';
          if (dropInput.value === 'Local Trip') dropInput.value = '';
        }
      }
    }

    document.querySelectorAll('#return-date-wrap').forEach(wrap => {
      if (type === 'round' || type === 'local') wrap.classList.remove('hidden');
      else wrap.classList.add('hidden');
    });
  };
});

// Swap Locations
const swapBtn = document.querySelector('.swap-btn');
if (swapBtn) {
  swapBtn.onclick = () => {
    const pickup = document.getElementById('pickup') || document.getElementById('booking-pickup');
    const drop = document.getElementById('drop') || document.getElementById('booking-drop');
    if (pickup && drop) {
      const temp = pickup.value;
      pickup.value = drop.value;
      drop.value = temp;
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// WHATSAPP BOOKING
// ═══════════════════════════════════════════════════════════════════════════

function sendToWhatsApp(formData) {
  const phone = '918940387531';
  const tripType = document.querySelector('.trip-btn.active')?.innerText.trim() || 'One Way';
  let message = `*🚕 New Cab Booking Request*\n\n`;
  message += `*📍 Trip:* ${tripType}\n`;
  message += `*🛫 Pickup:* ${formData.pickup || 'Not specified'}\n`;
  message += `*🛬 Drop:* ${formData.drop || 'Not specified'}\n`;
  message += `*📅 Date:* ${formData.date || formData.travel_date || 'Not specified'}\n`;
  message += `*⏰ Time:* ${formData.time || formData.travel_time || 'Not specified'}\n`;
  const lowType = tripType.toLowerCase();
  if (formData.returnDate && (lowType.includes('round') || lowType.includes('local'))) {
    message += `*🔙 Return:* ${formData.returnDate}\n`;
  }
  if (formData.carType || formData.car_type) message += `*🚗 Car:* ${formData.carType || formData.car_type}\n`;
  if (formData.passengers) message += `*👥 Passengers:* ${formData.passengers}\n`;
  if (formData.luggage)    message += `*🧳 Luggage:* ${formData.luggage}\n`;
  if (formData.name)       message += `*👤 Name:* ${formData.name}\n`;
  if (formData.phone)      message += `*📞 Contact:* ${formData.phone}\n`;
  if (formData.email)      message += `*📧 Email:* ${formData.email}\n`;
  if (formData.notes)      message += `*📝 Notes:* ${formData.notes}\n`;
  if (formData.payment)    message += `*💰 Payment:* ${formData.payment}\n`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

// ═══════════════════════════════════════════════════════════════════════════
// HERO FORM
// ═══════════════════════════════════════════════════════════════════════════

const heroForm = document.getElementById('hero-booking-form');
if (heroForm) {
  heroForm.onsubmit = (e) => {
    e.preventDefault();
    const data = {
      pickup:   document.getElementById('pickup').value,
      drop:     document.getElementById('drop').value,
      date:     document.getElementById('travel-date').value,
      time:     document.getElementById('travel-time').value,
      returnDate: document.getElementById('return-date')?.value,
      carType:  document.getElementById('car-type').options[document.getElementById('car-type').selectedIndex]?.text,
      passengers: document.getElementById('passengers').value
    };
    sendToWhatsApp(data);
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FULL BOOKING FORM — saves to Supabase
// ═══════════════════════════════════════════════════════════════════════════

const bookingForm = document.getElementById('booking-form');
if (bookingForm) {
  bookingForm.onsubmit = async (e) => {
    e.preventDefault();
    const selectedCar = document.querySelector('.car-option.selected .car-option-name')?.innerText || 'Not Selected';
    const paymentMode = document.querySelector('input[name="payment"]:checked')?.value || 'Not Specified';

    const data = {
      pickup:      document.getElementById('booking-pickup').value,
      drop:        document.getElementById('booking-drop').value,
      travel_date: document.getElementById('booking-date').value,
      travel_time: document.getElementById('booking-time').value,
      return_date: document.getElementById('return-date')?.value || null,
      passengers:  document.getElementById('booking-passengers').value,
      luggage:     document.getElementById('booking-luggage').value,
      name:        document.getElementById('booking-name').value,
      phone:       document.getElementById('booking-phone').value,
      email:       document.getElementById('booking-email').value,
      notes:       document.getElementById('booking-notes').value,
      car_type:    selectedCar,
      payment:     paymentMode,
      status:      'pending',
      trip_type:   document.getElementById('return-date')?.value ? 'round_trip' : 'one_way',
      created_at:  new Date().toISOString(),
    };

    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      await dataAPI.createBooking(data);
      sendToWhatsApp(data);
      alert('✓ Booking received! We will contact you shortly.');
      bookingForm.reset();
    } catch (err) {
      console.error('[Script] Booking save error:', err);
      alert('❌ Error saving booking. Sending via WhatsApp as backup.');
      sendToWhatsApp(data);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTACT FORM — saves to Supabase
// ═══════════════════════════════════════════════════════════════════════════

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.onsubmit = async (e) => {
    e.preventDefault();
    const phone   = '918940387531';
    const name    = document.getElementById('contact-name').value;
    const userPhone = document.getElementById('contact-phone').value;
    const email   = document.getElementById('contact-email').value;
    const subject = document.getElementById('contact-subject').value;
    const msg     = document.getElementById('contact-message').value;

    try {
      await dataAPI.createContactMessage({ name, phone: userPhone, email, subject, message: msg });
      alert('✓ Message received! We will respond soon.');
      contactForm.reset();
    } catch (err) {
      console.error('[Script] Contact save error:', err);
    }

    let message = `*📩 New Contact Enquiry*%0A%0A`;
    message += `*👤 Name:* ${name}%0A`;
    message += `*📞 Phone:* ${userPhone}%0A`;
    if (email)   message += `*📧 Email:* ${email}%0A`;
    if (subject) message += `*📌 Subject:* ${subject}%0A`;
    message += `%0A*💬 Message:*%0A${msg}`;
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };
}
