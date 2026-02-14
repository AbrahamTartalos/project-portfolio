/**
 * ADVANCED ANIMATIONS & MICRO-INTERACTIONS
 * Scroll-based animations, parallax, and interactive effects
 */

'use strict';

// ============================================
// PARALLAX EFFECT FOR HERO
// ============================================

class ParallaxEffect {
  constructor() {
    this.elements = document.querySelectorAll('[data-parallax]');
    this.init();
  }

  init() {
    if (!this.elements.length) return;

    window.addEventListener('scroll', () => {
      requestAnimationFrame(() => this.update());
    });
  }

  update() {
    const scrolled = window.pageYOffset;

    this.elements.forEach(element => {
      const speed = element.dataset.parallaxSpeed || 0.5;
      const yPos = -(scrolled * speed);
      element.style.transform = `translateY(${yPos}px)`;
    });
  }
}

// ============================================
// TYPING EFFECT FOR HERO TITLE
// ============================================

class TypingEffect {
  constructor(element, text, speed = 100) {
    this.element = element;
    this.text = text;
    this.speed = speed;
    this.charIndex = 0;
  }

  start() {
    if (!this.element) return;

    this.element.textContent = '';
    this.type();
  }

  type() {
    if (this.charIndex < this.text.length) {
      this.element.textContent += this.text.charAt(this.charIndex);
      this.charIndex++;
      setTimeout(() => this.type(), this.speed);
    }
  }
}

// ============================================
// GRADIENT TEXT REVEAL EFFECT
// ============================================

class GradientReveal {
  constructor() {
    this.elements = document.querySelectorAll('[data-gradient-reveal]');
    this.init();
  }

  init() {
    if (!this.elements.length) return;

    const observerOptions = {
      threshold: 0.5,
      rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    this.elements.forEach(el => {
      el.style.opacity = '0';
      observer.observe(el);
    });
  }

  animateElement(element) {
    element.style.transition = 'opacity 1s ease-out';
    element.style.opacity = '1';
    element.classList.add('text-gradient');
  }
}

// ============================================
// STAGGER ANIMATION FOR LISTS
// ============================================

class StaggerAnimation {
  constructor() {
    this.containers = document.querySelectorAll('[data-stagger]');
    this.init();
  }

  init() {
    if (!this.containers.length) return;

    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateChildren(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    this.containers.forEach(container => observer.observe(container));
  }

  animateChildren(container) {
    const children = Array.from(container.children);
    
    children.forEach((child, index) => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(30px)';
      
      setTimeout(() => {
        child.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        child.style.opacity = '1';
        child.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }
}

// ============================================
// SMOOTH REVEAL ON SCROLL
// ============================================

class SmoothReveal {
  constructor() {
    this.elements = document.querySelectorAll('[data-reveal]');
    this.init();
  }

  init() {
    if (!this.elements.length) return;

    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const direction = entry.target.dataset.reveal || 'up';
          this.reveal(entry.target, direction);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    this.elements.forEach(el => {
      el.style.opacity = '0';
      observer.observe(el);
    });
  }

  reveal(element, direction) {
    const animations = {
      'up': { transform: 'translateY(40px)' },
      'down': { transform: 'translateY(-40px)' },
      'left': { transform: 'translateX(40px)' },
      'right': { transform: 'translateX(-40px)' },
      'fade': { transform: 'scale(0.95)' }
    };

    const initialTransform = animations[direction] || animations['up'];
    element.style.transform = initialTransform.transform;
    
    setTimeout(() => {
      element.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0) translateX(0) scale(1)';
    }, 50);
  }
}

// ============================================
// COUNTER ANIMATION FOR METRICS
// ============================================

class CounterAnimation {
  constructor() {
    this.counters = document.querySelectorAll('[data-counter]');
    this.init();
  }

  init() {
    if (!this.counters.length) return;

    const observerOptions = {
      threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    this.counters.forEach(counter => observer.observe(counter));
  }

  animateCounter(element) {
    const target = parseInt(element.dataset.counter);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
      current += increment;
      if (current < target) {
        element.textContent = Math.floor(current);
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target;
      }
    };

    updateCounter();
  }
}

// ============================================
// MAGNETIC BUTTON EFFECT
// ============================================

class MagneticButton {
  constructor() {
    this.buttons = document.querySelectorAll('[data-magnetic]');
    this.init();
  }

  init() {
    if (!this.buttons.length) return;

    this.buttons.forEach(button => {
      button.addEventListener('mousemove', (e) => this.handleMove(e, button));
      button.addEventListener('mouseleave', (e) => this.handleLeave(e, button));
    });
  }

  handleMove(e, button) {
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    button.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  }

  handleLeave(e, button) {
    button.style.transform = 'translate(0, 0)';
  }
}

// ============================================
// CURSOR FOLLOWER (Optional, subtle effect)
// ============================================

class CursorFollower {
  constructor() {
    this.cursor = null;
    this.cursorDot = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.cursorX = 0;
    this.cursorY = 0;
    this.enabled = window.innerWidth > 1024; // Only on desktop
    
    if (this.enabled) {
      this.init();
    }
  }

  init() {
    this.createCursor();
    this.setupEventListeners();
    this.animate();
  }

  createCursor() {
    // Outer cursor
    this.cursor = document.createElement('div');
    this.cursor.className = 'custom-cursor';
    this.cursor.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      border: 2px solid var(--color-primary-teal);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s, transform 0.3s;
      mix-blend-mode: difference;
    `;

    // Inner dot
    this.cursorDot = document.createElement('div');
    this.cursorDot.className = 'custom-cursor-dot';
    this.cursorDot.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: var(--color-accent-orange);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s;
    `;

    document.body.appendChild(this.cursor);
    document.body.appendChild(this.cursorDot);
  }

  setupEventListeners() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      
      this.cursor.style.opacity = '1';
      this.cursorDot.style.opacity = '1';
      
      // Update dot position immediately
      this.cursorDot.style.left = e.clientX + 'px';
      this.cursorDot.style.top = e.clientY + 'px';
    });

    document.addEventListener('mouseenter', () => {
      this.cursor.style.opacity = '1';
      this.cursorDot.style.opacity = '1';
    });

    document.addEventListener('mouseleave', () => {
      this.cursor.style.opacity = '0';
      this.cursorDot.style.opacity = '0';
    });

    // Expand on hover over interactive elements
    const interactives = document.querySelectorAll('a, button, [data-magnetic]');
    interactives.forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.cursor.style.transform = 'scale(1.5)';
      });
      el.addEventListener('mouseleave', () => {
        this.cursor.style.transform = 'scale(1)';
      });
    });
  }

  animate() {
    // Smooth follow effect
    this.cursorX += (this.mouseX - this.cursorX) * 0.1;
    this.cursorY += (this.mouseY - this.cursorY) * 0.1;

    this.cursor.style.left = this.cursorX - 20 + 'px';
    this.cursor.style.top = this.cursorY - 20 + 'px';

    requestAnimationFrame(() => this.animate());
  }
}

// ============================================
// SCROLL PROGRESS BAR
// ============================================

class ScrollProgress {
  constructor() {
    this.progressBar = null;
    this.init();
  }

  init() {
    this.createProgressBar();
    this.updateProgress();
    
    window.addEventListener('scroll', () => {
      requestAnimationFrame(() => this.updateProgress());
    });
  }

  createProgressBar() {
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'scroll-progress';
    this.progressBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--color-primary-teal), var(--color-accent-orange));
      z-index: 9999;
      transition: width 0.1s;
    `;
    
    document.body.appendChild(this.progressBar);
  }

  updateProgress() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    
    this.progressBar.style.width = scrolled + '%';
  }
}

// ============================================
// IMAGE LAZY LOAD WITH BLUR EFFECT
// ============================================

class LazyLoadImages {
  constructor() {
    this.images = document.querySelectorAll('img[data-src]');
    this.init();
  }

  init() {
    if (!this.images.length) return;

    const observerOptions = {
      threshold: 0,
      rootMargin: '50px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    this.images.forEach(img => {
      img.style.filter = 'blur(10px)';
      img.style.transition = 'filter 0.3s';
      observer.observe(img);
    });
  }

  loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;

    img.src = src;
    img.onload = () => {
      img.style.filter = 'blur(0)';
      img.removeAttribute('data-src');
    };
  }
}

// ============================================
// TEXT SPLIT ANIMATION
// ============================================

class TextSplitAnimation {
  constructor() {
    this.elements = document.querySelectorAll('[data-text-split]');
    this.init();
  }

  init() {
    if (!this.elements.length) return;

    this.elements.forEach(element => {
      const text = element.textContent;
      const words = text.split(' ');
      
      element.innerHTML = words.map((word, i) => {
        return `<span class="word" style="display: inline-block; opacity: 0; transform: translateY(20px); animation: wordFadeIn 0.6s ease-out forwards; animation-delay: ${i * 0.1}s;">${word}</span> `;
      }).join('');
    });
  }
}

// Add CSS for text split animation
const style = document.createElement('style');
style.textContent = `
  @keyframes wordFadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

// ============================================
// INITIALIZE ALL ANIMATION MODULES
// ============================================

function initializeAnimations() {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    console.log('Reduced motion preferred - skipping animations');
    return;
  }

  // Initialize all animation classes
  new ParallaxEffect();
  new GradientReveal();
  new StaggerAnimation();
  new SmoothReveal();
  new CounterAnimation();
  new MagneticButton();
  new ScrollProgress();
  new LazyLoadImages();
  new TextSplitAnimation();
  
  // Optional: Cursor follower (can be disabled)
  // new CursorFollower();

  // Hero typing effect (if element exists)
  const heroTitle = document.querySelector('[data-typing]');
  if (heroTitle) {
    const text = heroTitle.textContent;
    const typing = new TypingEffect(heroTitle, text, 80);
    // Start after a small delay
    setTimeout(() => typing.start(), 500);
  }

  console.log('Animations initialized! ✨');
}

// ============================================
// START ANIMATIONS AFTER DOM LOAD
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAnimations);
} else {
  initializeAnimations();
}

// Export for global access
window.AnimationModules = {
  ParallaxEffect,
  TypingEffect,
  GradientReveal,
  StaggerAnimation,
  SmoothReveal,
  CounterAnimation,
  MagneticButton,
  CursorFollower,
  ScrollProgress,
  LazyLoadImages,
  TextSplitAnimation
};
