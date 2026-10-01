/* ============================================
   SARAN TOURS & TRAVELS — tariff.js
   Tariff Page Specific JavaScript
============================================ */

/* ── FAQ ACCORDION ── */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all other items
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          const otherAnswer = other.querySelector('.faq-answer');
          if (otherAnswer) otherAnswer.classList.remove('open');
        }
      });

      // Toggle current item
      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', (!isOpen).toString());
      answer.classList.toggle('open', !isOpen);
    });
  });
}

/* ── ROUTE TAB SWITCHER ── */
function initRouteTabs() {
  const tabs = document.querySelectorAll('.route-tab');
  const onewayRows = document.getElementById('oneway-rows');
  const roundtripRows = document.getElementById('roundtrip-rows');

  if (!tabs.length || !onewayRows || !roundtripRows) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.tab;

      if (target === 'oneway') {
        onewayRows.classList.remove('hidden');
        roundtripRows.classList.add('hidden');
      } else {
        roundtripRows.classList.remove('hidden');
        onewayRows.classList.add('hidden');
      }

      // Animate rows in
      const activeRows = target === 'oneway' ? onewayRows : roundtripRows;
      activeRows.querySelectorAll('.route-row').forEach((row, i) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(10px)';
        setTimeout(() => {
          row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          row.style.opacity = '1';
          row.style.transform = 'translateY(0)';
        }, i * 60);
      });
    });
  });
}

/* ── PRICING CARD HOVER DEPTH EFFECT ── */
function initCardDepth() {
  const cards = document.querySelectorAll('.pricing-card, .airport-card, .why-tariff-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${y * -4}deg) rotateY(${x * 4}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease';
    });
  });
}

/* ── TRUST STRIP MARQUEE (on mobile) ── */
function initTrustStrip() {
  const trustInner = document.querySelector('.trust-inner');
  if (!trustInner) return;

  // Duplicate items for seamless scroll on small screens
  if (window.innerWidth < 700) {
    const items = trustInner.innerHTML;
    trustInner.innerHTML = items + items;
  }
}

/* ── FARE CALCULATOR COUNTER EFFECT ── */
function animateFareAmounts() {
  const fareAmounts = document.querySelectorAll('.fare-amount');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.textContent);
        if (isNaN(target)) return;

        let start = 0;
        const duration = 800;
        const startTime = performance.now();

        const update = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target);
          if (progress < 1) requestAnimationFrame(update);
          else el.textContent = target;
        };

        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  fareAmounts.forEach(el => observer.observe(el));
}

/* ── STICKY HEADER ACTIVE STATE ── */
function initStickyNav() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  // Ensure tariff link is always active on this page
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.href && link.href.includes('tariff.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* ── SMOOTH SCROLL FOR ANCHOR LINKS ── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ── BOOK BTN RIPPLE EFFECT ── */
function initRipple() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255,255,255,0.35);
        pointer-events: none;
        transform: scale(0);
        animation: rippleAnim 0.55s linear;
        width: 60px; height: 60px;
        left: ${e.clientX - rect.left - 30}px;
        top: ${e.clientY - rect.top - 30}px;
      `;
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Add keyframe if not already present
  if (!document.querySelector('#ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = `@keyframes rippleAnim { to { transform: scale(4); opacity: 0; } }`;
    document.head.appendChild(style);
  }
}

/* ── HERO PARALLAX ── */
function initHeroParallax() {
  const heroBg = document.querySelector('.tariff-hero-bg');
  if (!heroBg) return;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY < 600) {
      heroBg.style.transform = `translateY(${scrollY * 0.25}px)`;
    }
  }, { passive: true });
}

/* ── INIT ALL ── */
document.addEventListener('DOMContentLoaded', () => {
  initFAQ();
  initRouteTabs();
  initStickyNav();
  initSmoothScroll();
  initRipple();
  initHeroParallax();
  initTrustStrip();

  // Delay card depth to avoid initial layout jank
  setTimeout(initCardDepth, 500);
  setTimeout(animateFareAmounts, 300);
});
