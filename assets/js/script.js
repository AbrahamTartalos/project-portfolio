/**
 * PORTFOLIO 2026 - MODERN JAVASCRIPT
 * Main functionality and interactions
 */

'use strict';

// ============================================
// UTILITY FUNCTIONS
// ============================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// ============================================
// THEME TOGGLE
// ============================================

class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'dark';
    this.toggleBtn = null;
    this.init();
  }

  init() {
    this.applyTheme();
    this.createToggleButton();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  toggle() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
    localStorage.setItem('theme', this.theme);
    this.updateToggleButton();
  }

  createToggleButton() {
    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.setAttribute('aria-label', 'Toggle theme');
    button.innerHTML = `<ion-icon name="${this.theme === 'dark' ? 'sunny' : 'moon'}-outline"></ion-icon>`;
    
    button.addEventListener('click', () => this.toggle());
    document.body.appendChild(button);
    this.toggleBtn = button;
  }

  updateToggleButton() {
    if (this.toggleBtn) {
      this.toggleBtn.innerHTML = `<ion-icon name="${this.theme === 'dark' ? 'sunny' : 'moon'}-outline"></ion-icon>`;
    }
  }
}

// ============================================
// NAVIGATION
// ============================================

class NavigationManager {
  constructor() {
    this.navLinks = $$('[data-nav-link]');
    this.pages = $$('[data-page]');
    this.init();
  }

  init() {
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => this.handleNavClick(e));
    });
  }

  handleNavClick(e) {
    const targetPage = e.currentTarget.dataset.navLink.toLowerCase();
    
    // Update active page
    this.pages.forEach(page => {
      if (page.dataset.page.toLowerCase() === targetpage) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });

    // Update active nav link
    this.navLinks.forEach(link => link.classList.remove('active'));
    e.currentTarget.classList.add('active');

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ============================================
// SIDEBAR TOGGLE (Mobile)
// ============================================

class SidebarManager {
  constructor() {
    this.sidebar = $('[data-sidebar]');
    this.toggleBtn = $('[data-sidebar-btn]');
    this.init();
  }

  init() {
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => {
        this.sidebar?.classList.toggle('active');
      });
    }
  }
}

// ============================================
// PROJECT FILTER
// ============================================

class ProjectFilter {
  constructor() {
    this.filterBtns = $$('[data-filter-btn]');
    this.selectValue = $('[data-select-value]');
    this.select = $('[data-select]');
    this.selectItems = $$('[data-select-item]');
    this.projectItems = $$('[data-filter-item]');
    this.lastClickedBtn = this.filterBtns[0];
    this.init();
  }

  init() {
    // Desktop filter buttons
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.filterProjects(e));
    });

    // Mobile select
    if (this.select) {
      this.select.addEventListener('click', () => {
        this.select.classList.toggle('active');
      });
    }

    this.selectItems.forEach(item => {
      item.addEventListener('click', (e) => this.handleSelectFilter(e));
    });
  }

  filterProjects(e) {
    const selectedValue = e.currentTarget.innerText.toLowerCase().trim();
    
    this.projectItems.forEach(item => {
      const category = item.dataset.category ? item.dataset.category.toLowerCase().trim() : '';
      
      if (selectedValue === 'todos' || category.includes(selectedValue)) {
        item.classList.add('active');
        item.style.display = 'block';
      } else {
        item.classList.remove('active');
        item.style.display = 'none';
      }
    });

    // Update active button
    this.lastClickedBtn?.classList.remove('active');
    e.currentTarget.classList.add('active');
    this.lastClickedBtn = e.currentTarget;
  }

  handleSelectFilter(e) {
    const selectedValue = e.currentTarget.innerText;
    
    if (this.selectValue) {
      this.selectValue.innerText = selectedValue;
    }
    
    this.select?.classList.remove('active');
    
    // Trigger filter
    const fakeEvent = { currentTarget: { innerText: selectedValue } };
    this.filterProjects(fakeEvent);
  }
}

// ============================================
// FORM VALIDATION & SUBMISSION
// ============================================

class FormManager {
  constructor() {
    this.form = $('[data-form]');
    this.formInputs = $$('[data-form-input]');
    this.formBtn = $('[data-form-btn]');
    this.messageBox = $('#form-message');
    this.linkedinField = null;
    this.init();
  }

  init() {
    if (!this.form) return;

    // Setup LinkedIn field validation
    this.linkedinField = this.form.elements.linkedin;
    if (this.linkedinField) {
      this.setupLinkedInValidation();
    }

    // Real-time validation
    this.formInputs.forEach(input => {
      input.addEventListener('input', () => this.validateForm());
    });

    // Form submission
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  setupLinkedInValidation() {
    this.linkedinField.removeAttribute('required');
    this.linkedinField.removeAttribute('pattern');
    
    this.linkedinField.addEventListener('input', () => {
      const value = this.linkedinField.value.trim();
      if (value === '' || this.validateUrl(value)) {
        this.linkedinField.setCustomValidity('');
      } else {
        this.linkedinField.setCustomValidity('Por favor ingresa una URL válida o deja el campo vacío');
      }
    });
  }

  validateUrl(url) {
    if (!url || url.trim() === '') return true;
    const urlPattern = /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?$/i;
    return urlPattern.test(url.trim());
  }

  validateForm() {
    let isValid = true;
    
    // Check required fields
    const requiredFields = this.form.querySelectorAll('input[required], select[required], textarea[required]');
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        isValid = false;
      }
    });
    
    // Check LinkedIn if has content
    if (this.linkedinField && this.linkedinField.value.trim() && !this.validateUrl(this.linkedinField.value)) {
      isValid = false;
    }
    
    if (this.formBtn) {
      this.formBtn.disabled = !isValid;
    }
  }

  async handleSubmit(e) {
    // Prevent submission on select elements
    if (e.target.tagName.toLowerCase() === 'select') {
      return;
    }

    e.preventDefault();

    try {
      // Gather form data
      const formData = {
        name: this.form.elements.name?.value.trim() || '',
        correo_electronico: this.form.elements.email?.value.trim() || '',
        numero_telefono: this.form.elements.phone?.value.trim() || '',
        ciudad_id: this.form.elements.city?.value || '',
        otra_ciudad: this.form.elements.otherCity?.value.trim() || '',
        mensaje: this.form.elements.message?.value.trim() || '',
        motivo_contacto: this.form.elements.reason?.value || '',
        linkedin_o_web: this.form.elements.linkedin?.value.trim() || '',
        honeypot: this.form.elements.honeypot?.value.trim() || ''
      };

      // Basic validation
      if (!formData.name || !formData.correo_electronico || !formData.mensaje) {
        this.showMessage('Por favor completa todos los campos obligatorios', 'error');
        return;
      }

      // Validate LinkedIn/Web URL
      if (formData.linkedin_o_web && !this.validateUrl(formData.linkedin_o_web)) {
        this.showMessage('Por favor ingresa una URL válida en el campo LinkedIn/Web o déjalo vacío', 'error');
        return;
      }

      // Disable button and show loading state
      if (this.formBtn) {
        this.formBtn.disabled = true;
        this.formBtn.innerHTML = '<span class="loading-spinner"></span> Enviando...';
      }

      // Submit form
      const response = await fetch('/submit_form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('El servidor no devolvió JSON válido');
      }

      const responseData = await response.json();
      
      if (response.ok) {
        this.showMessage('¡Mensaje enviado correctamente!', 'success');
        this.form.reset();
        this.hideOtraCiudad();
        this.triggerConfetti();
      } else {
        this.showMessage(responseData.message || 'Hubo un error al enviar el mensaje.', 'error');
      }

    } catch (error) {
      console.error('Error:', error);
      this.showMessage('Error de conexión con el servidor. Por favor intenta nuevamente.', 'error');
    } finally {
      // Re-enable button
      if (this.formBtn) {
        this.formBtn.disabled = false;
        this.formBtn.innerHTML = '<ion-icon name="paper-plane"></ion-icon><span>Enviar Mensaje</span>';
      }
    }
  }

  showMessage(message, type = 'success') {
    if (this.messageBox) {
      this.messageBox.textContent = message;
      this.messageBox.className = `form-message ${type}`;
      this.messageBox.style.display = 'block';

      setTimeout(() => {
        this.messageBox.style.display = 'none';
      }, 5000);
    } else {
      // Fallback to toast notification
      this.showToast(message, type);
    }
  }

  showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        <ion-icon name="${type === 'success' ? 'checkmark-circle' : 'alert-circle'}-outline"></ion-icon>
      </div>
      <div class="toast-content">
        <div class="toast-title">${type === 'success' ? '¡Éxito!' : 'Error'}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">
        <ion-icon name="close-outline"></ion-icon>
      </button>
    `;

    let container = $('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.style.animation = 'toastSlideIn 0.3s reverse';
      setTimeout(() => toast.remove(), 300);
    }, 5000);

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.style.animation = 'toastSlideIn 0.3s reverse';
      setTimeout(() => toast.remove(), 300);
    });
  }

  hideOtraCiudad() {
    const otraCiudadDiv = $('#otra_ciudad');
    if (otraCiudadDiv) {
      otraCiudadDiv.style.display = 'none';
    }
  }

  triggerConfetti() {
    const colors = ['#006d77', '#ff9800', '#00a8b5', '#ffb84d'];
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      confettiContainer.appendChild(confetti);
    }

    setTimeout(() => confettiContainer.remove(), 3000);
  }
}

// ============================================
// CIUDAD SELECT HANDLER
// ============================================

function mostrarOtraCiudad(select) {
  const otraCiudadDiv = $('#otra_ciudad');
  if (otraCiudadDiv) {
    otraCiudadDiv.style.display = select.value === 'otra' ? 'block' : 'none';
  }
}

// ============================================
// SELECT FIX FOR MOBILE
// ============================================

function fixMobileSelects() {
  $$('select').forEach(select => {
    select.addEventListener('focus', () => {
      select.size = select.options.length;
    });

    select.addEventListener('blur', () => {
      select.size = 1;
    });

    select.addEventListener('change', () => {
      select.size = 1;
    });
  });
}

// ============================================
// PHONE NUMBER REVEAL
// ============================================

class PhoneManager {
  constructor() {
    this.phoneLink = $('#phone-link');
    this.clicked = false;
    this.init();
  }

  init() {
    if (!this.phoneLink) return;

    this.phoneLink.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (!this.clicked) {
        // First click: show number
        this.phoneLink.textContent = '+54 (387) 227-7116';
        this.phoneLink.href = 'https://wa.me/543872277116';
        this.clicked = true;
      } else {
        // Second click: open WhatsApp
        window.open(this.phoneLink.href, '_blank');
      }
    });
  }
}

// ============================================
// SCROLL TO TOP BUTTON
// ============================================

class ScrollToTop {
  constructor() {
    this.button = null;
    this.init();
  }

  init() {
    this.createButton();
    this.setupScrollListener();
  }

  createButton() {
    this.button = document.createElement('button');
    this.button.className = 'scroll-to-top';
    this.button.setAttribute('aria-label', 'Scroll to top');
    this.button.innerHTML = '<ion-icon name="arrow-up-outline"></ion-icon>';
    
    this.button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    document.body.appendChild(this.button);
  }

  setupScrollListener() {
    const toggleButton = throttle(() => {
      if (window.scrollY > 500) {
        this.button.classList.add('visible');
      } else {
        this.button.classList.remove('visible');
      }
    }, 100);

    window.addEventListener('scroll', toggleButton);
  }
}

// ============================================
// LANGUAGE TOGGLE
// ============================================

class LanguageManager {
  constructor() {
    this.toggle = $('#language-toggle');
    this.buttons = $$('[data-language-button]');
    this.currentLang = 'es';
    this.init();
  }

  init() {
    if (!this.toggle) return;

    this.toggle.addEventListener('click', async () => {
      const activeBtn = $('.language-button.active');
      const inactiveBtn = $('.language-button:not(.active)');
      
      if (activeBtn && inactiveBtn) {
        this.toggleButtons(activeBtn, inactiveBtn);
        
        // Here you would implement actual translation
        // For now, we'll just toggle the active state
        this.currentLang = this.currentLang === 'es' ? 'en' : 'es';
        this.toggle.setAttribute('lang', this.currentLang);
      }
    });
  }

  toggleButtons(activeBtn, inactiveBtn) {
    activeBtn.classList.remove('active');
    inactiveBtn.classList.add('active');
  }

  async translateText(text, targetLang) {
    try {
      const response = await fetch('/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_lang: targetLang })
      });

      if (!response.ok) throw new Error('Translation failed');

      const data = await response.json();
      return data.translations?.[0]?.text || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }
}

// ============================================
// SCROLL ANIMATIONS (Intersection Observer)
// ============================================

class ScrollAnimations {
  constructor() {
    this.elements = $$('[data-animate]');
    this.init();
  }

  init() {
    if (!this.elements.length) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    this.elements.forEach(el => observer.observe(el));
  }
}

// ============================================
// PROJECT MODAL
// ============================================

class ProjectModal {
  constructor() {
    this.modal = null;
    this.init();
  }

  init() {
    this.createModal();
    this.setupProjectLinks();
  }

  createModal() {
    const modal = document.createElement('div');
    modal.className = 'project-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <button class="modal-close" aria-label="Close modal">
          <ion-icon name="close-outline"></ion-icon>
        </button>
        <div class="modal-body"></div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.modal = modal;

    // Close handlers
    modal.querySelector('.modal-backdrop').addEventListener('click', () => this.close());
    modal.querySelector('.modal-close').addEventListener('click', () => this.close());
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.close();
      }
    });
  }

  setupProjectLinks() {
    // You can add modal triggers to project items
    // For now, external links work as they are
  }

  open(content) {
    const modalBody = this.modal.querySelector('.modal-body');
    modalBody.innerHTML = content;
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ============================================
// INITIALIZE ALL MODULES
// ============================================

function initializeApp() {
  // Core functionality
  new ThemeManager();
  new NavigationManager();
  new SidebarManager();
  new ProjectFilter();
  new FormManager();
  new PhoneManager();
  new ScrollToTop();
  new LanguageManager();
  new ScrollAnimations();
  new ProjectModal();

  // Utility functions
  fixMobileSelects();

  // Log initialization
  console.log('Portfolio 2026 initialized successfully! 🚀');
}

// ============================================
// START APPLICATION
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for global access if needed
window.mostrarOtraCiudad = mostrarOtraCiudad;
