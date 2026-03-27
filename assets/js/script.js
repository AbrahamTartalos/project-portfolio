/**
 * Portfolio Abraham Tartalos — script.js
 * Layout: scroll largo con secciones ancladas
 */

'use strict';

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const throttle = (fn, ms) => {
  let t;
  return (...a) => { if (!t) { fn(...a); t = setTimeout(() => (t = null), ms); } };
};


/* ============================================================
   THEME MANAGER
   ============================================================ */

class ThemeManager {
  constructor() {
    const saved = localStorage.getItem('portfolio-theme');
    const sys   = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.theme  = saved || (sys ? 'dark' : 'light');
    this.btn    = $('#theme-btn');
    this.apply();
    this.btn?.addEventListener('click', () => this.toggle());

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('portfolio-theme')) {
        this.theme = e.matches ? 'dark' : 'light';
        this.apply();
      }
    });
  }

  apply() {
    document.documentElement.setAttribute('data-theme', this.theme);
    if (this.btn) {
      this.btn.innerHTML = `<ion-icon name="${this.theme === 'dark' ? 'sunny' : 'moon'}-outline"></ion-icon>`;
    }
  }

  toggle() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('portfolio-theme', this.theme);
    this.apply();
  }
}


/* ============================================================
   ACTIVE NAV ON SCROLL
   Resalta el link de la sección visible
   ============================================================ */

class ActiveNavOnScroll {
  constructor() {
    this.links    = $$('.nav-link[data-section]');
    this.sections = [];
    this.build();
    window.addEventListener('scroll', throttle(() => this.update(), 80));
  }

  build() {
    this.links.forEach((link) => {
      const id  = link.dataset.section;
      const sec = $(`#${id}`);
      if (sec) this.sections.push({ link, sec });
    });
  }

  update() {
    const mid = window.scrollY + window.innerHeight * 0.4;
    let active = this.sections[0];

    this.sections.forEach(({ link, sec }) => {
      if (sec.offsetTop <= mid) active = { link, sec };
    });

    this.links.forEach((l) => l.classList.remove('active'));
    active?.link.classList.add('active');
  }
}


/* ============================================================
   HAMBURGER (mobile nav)
   ============================================================ */

class MobileNav {
  constructor() {
    this.btn   = $('#hamburger');
    this.links = $('#nav-links');
    this.open  = false;
    this.btn?.addEventListener('click', () => this.toggle());

    // Cerrar al hacer clic en un link
    $$('.nav-link').forEach((l) => l.addEventListener('click', () => this.close()));
  }

  toggle() {
    this.open = !this.open;
    this.btn.classList.toggle('open', this.open);
    this.links.classList.toggle('mobile-open', this.open);
    this.btn.setAttribute('aria-expanded', this.open);
  }

  close() {
    this.open = false;
    this.btn?.classList.remove('open');
    this.links?.classList.remove('mobile-open');
    this.btn?.setAttribute('aria-expanded', 'false');
  }
}


/* ============================================================
   SCROLL PROGRESS BAR
   ============================================================ */

class ScrollProgress {
  constructor() {
    this.bar = $('#scroll-progress');
    window.addEventListener('scroll', throttle(() => this.update(), 40));
  }

  update() {
    if (!this.bar) return;
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    this.bar.style.width = pct + '%';
  }
}


/* ============================================================
   SCROLL TO TOP
   ============================================================ */

class ScrollToTop {
  constructor() {
    this.btn = $('#scroll-top');
    window.addEventListener('scroll', throttle(() => {
      this.btn?.classList.toggle('visible', window.scrollY > 500);
    }, 100));
    this.btn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
}


/* ============================================================
   SMOOTH REVEAL — IntersectionObserver
   ============================================================ */

class SmoothReveal {
  constructor() {
    const els = $$('[data-reveal]');
    if (!els.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('visible'));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
    );

    els.forEach((el) => obs.observe(el));
  }
}


/* ============================================================
   LANGUAGE MANAGER — traducción estática
   ============================================================ */

class LanguageManager {
  constructor() {
    this.lang    = localStorage.getItem('portfolio-lang') || 'es';
    this.buttons = $$('.lang-btn[data-lang]');
    this.apply(this.lang);

    this.buttons.forEach((btn) =>
      btn.addEventListener('click', () => {
        this.lang = btn.dataset.lang;
        localStorage.setItem('portfolio-lang', this.lang);
        this.apply(this.lang);
      })
    );
  }

  apply(lang) {
    document.documentElement.setAttribute('lang', lang);

    // Texto
    $$('[data-es]').forEach((el) => {
      const t = el.getAttribute(`data-${lang}`);
      if (t !== null) el.textContent = t;
    });

    // Placeholders
    $$('[data-placeholder-es]').forEach((el) => {
      const p = el.getAttribute(`data-placeholder-${lang}`);
      if (p !== null) el.setAttribute('placeholder', p);
    });

    // Botones activos
    this.buttons.forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
  }
}


/* ============================================================
   FORM MANAGER
   ============================================================ */

class FormManager {
  constructor() {
    this.form   = $('[data-form]');
    this.inputs = $$('[data-form-input]');
    this.btn    = $('[data-form-btn]');
    this.msg    = $('#form-message');
    this.linkedin = null;
    this.init();
  }

  init() {
    if (!this.form) return;

    this.linkedin = this.form.elements.linkedin;
    if (this.linkedin) {
      this.linkedin.removeAttribute('required');
      this.linkedin.removeAttribute('pattern');
      this.linkedin.addEventListener('input', () => this.validateLinkedIn());
    }

    this.inputs.forEach((i) => i.addEventListener('input', () => this.checkValidity()));
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  validateLinkedIn() {
    const v = this.linkedin.value.trim();
    this.linkedin.setCustomValidity(
      v === '' || this.isUrl(v) ? '' : 'URL no válida'
    );
  }

  isUrl(u) {
    return /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)([\w\-.,@?^=%&:/~+#]*)?$/i.test(u.trim());
  }

  checkValidity() {
    let ok = true;
    this.form.querySelectorAll('[required]').forEach((f) => {
      if (!f.value.trim()) ok = false;
    });
    if (this.linkedin?.value.trim() && !this.isUrl(this.linkedin.value)) ok = false;
    if (this.btn) this.btn.disabled = !ok;
  }

  showMsg(text, type) {
    if (!this.msg) return;
    this.msg.textContent  = text;
    this.msg.className    = `form-message ${type}`;
    setTimeout(() => { if (this.msg) this.msg.className = 'form-message'; }, 6000);
  }

  async handleSubmit(e) {
    e.preventDefault();
    const btn = this.btn;
    const span = btn?.querySelector('span');
    if (btn) { btn.disabled = true; if (span) span.textContent = 'Enviando…'; }

    try {
      const els = this.form.elements;
      const payload = {
        name:              els.name?.value.trim()      || '',
        correo_electronico: els.email?.value.trim()    || '',
        numero_telefono:   els.phone?.value.trim()     || '',
        ciudad_id:         els.city?.value             || '',
        otra_ciudad:       els.otherCity?.value.trim() || '',
        mensaje:           els.message?.value.trim()   || '',
        motivo_contacto:   els.reason?.value           || '',
        linkedin_o_web:    els.linkedin?.value.trim()  || '',
        honeypot:          els.honeypot?.value.trim()  || '',
      };

      if (!payload.name || !payload.correo_electronico || !payload.mensaje) {
        this.showMsg('Completá todos los campos obligatorios.', 'error');
        return;
      }

      const res  = await fetch('/submit_form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        this.showMsg('¡Mensaje enviado correctamente! 🎉', 'success');
        this.form.reset();
        const wrap = $('#otra_ciudad_wrap');
        if (wrap) wrap.style.display = 'none';
      } else {
        this.showMsg(data.message || 'Error al enviar. Intentá de nuevo.', 'error');
      }
    } catch (err) {
      console.error(err);
      this.showMsg('Error de conexión. Verificá tu internet e intentá de nuevo.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        if (span) span.textContent = 'Enviar mensaje';
      }
    }
  }
}


/* ============================================================
   PHONE REVEAL
   ============================================================ */

class PhoneManager {
  constructor() {
    this.link    = $('#phone-link');
    this.clicked = false;
    this.link?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!this.clicked) {
        this.link.textContent = '+54 (387) 227-7116';
        this.link.href = 'https://wa.me/543872277116';
        this.clicked = true;
      } else {
        window.open(this.link.href, '_blank');
      }
    });
  }
}


/* ============================================================
   CIUDAD SELECT
   ============================================================ */

function mostrarOtraCiudad(select) {
  const wrap = $('#otra_ciudad_wrap');
  if (wrap) wrap.style.display = select.value === 'otra' ? 'block' : 'none';
}


/* ============================================================
   SELECT FIX MOBILE
   ============================================================ */

function fixMobileSelects() {
  $$('select').forEach((sel) => {
    sel.addEventListener('focus',  () => (sel.size = sel.options.length));
    sel.addEventListener('blur',   () => (sel.size = 1));
    sel.addEventListener('change', () => (sel.size = 1));
  });
}


/* ============================================================
   INIT
   ============================================================ */

function initApp() {
  new ThemeManager();
  new ActiveNavOnScroll();
  new MobileNav();
  new ScrollProgress();
  new ScrollToTop();
  new SmoothReveal();
  new LanguageManager();
  new FormManager();
  new PhoneManager();
  fixMobileSelects();
  console.log('Portfolio v2 iniciado ✓');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

window.mostrarOtraCiudad = mostrarOtraCiudad;
