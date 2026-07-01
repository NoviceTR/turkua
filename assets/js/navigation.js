// ══ MOBİL HAMBURGER MENÜ ══
const mobileMenuButton = document.getElementById('hamburgerBtn');
const mobileMenuLinks = document.getElementById('navLinks');
const topNavigation = document.querySelector('body > nav:not(.bottom-nav)');
const bottomNavigationLinks = [...document.querySelectorAll('.bottom-nav a')];

function toggleMobileMenu() {
  const isOpen = mobileMenuLinks.classList.toggle('open');
  mobileMenuButton.classList.toggle('open', isOpen);
  mobileMenuButton.setAttribute('aria-expanded', String(isOpen));
}

function closeMobileMenu() {
  mobileMenuButton.classList.remove('open');
  mobileMenuButton.setAttribute('aria-expanded', 'false');
  mobileMenuLinks.classList.remove('open');
}

window.Turkua.onReady(() => {
  mobileMenuLinks.addEventListener('click', event => {
    if (event.target.closest('a')) closeMobileMenu();
  });
  document.addEventListener('click', e => {
    if (!topNavigation.contains(e.target)) closeMobileMenu();
  });
});

// ══ ALT NAV AKTİF DURUM ══
function setBottomActive(el) {
  bottomNavigationLinks.forEach(link => link.classList.toggle('active', link === el));
}

// ══ SERVICE WORKER KAYDI ══
if ('serviceWorker' in navigator) {
  const serviceWorkerUrl = new URL('sw.js', document.baseURI);
  const registerServiceWorker = () => {
    if (!/^https?:$/.test(serviceWorkerUrl.protocol)) return;
    navigator.serviceWorker.register(serviceWorkerUrl.href).catch(() => {});
  };
  window.Turkua.onReady(() => {
    if (document.readyState === 'complete') setTimeout(registerServiceWorker, 0);
    else window.addEventListener('load', registerServiceWorker, { once: true });
  });
}

// Re-render when language changes
function syncLanguageControls(lang) {
  document.querySelectorAll('.lang-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.language === lang);
  });
  const language = window.TurkuaI18n?.getLanguages().find(item => item.code === lang);
  const label = (language?.short_label || language?.code || lang).toUpperCase();
  const bnIcon = document.getElementById('bnLangIcon');
  const bnLabel = document.getElementById('bnLangLabel');
  if (bnIcon) bnIcon.textContent = label;
  if (bnLabel) bnLabel.textContent = label;
}

function setLang(lang) {
  if (window.TurkuaI18n) {
    window.TurkuaI18n.setLocale(lang);
  } else {
    document.documentElement.setAttribute('data-lang', lang);
    localStorage.setItem('turkua-lang', lang);
    window.dispatchEvent(new CustomEvent('turkua:languagechange', { detail: { locale: lang } }));
  }
  syncLanguageControls(lang);
}

function toggleLangBn() {
  const languages = window.TurkuaI18n?.getLanguages() || [];
  const current = document.documentElement.getAttribute('data-lang') || 'tr';
  const index = languages.findIndex(language => language.code === current);
  const next = languages[(index + 1) % languages.length];
  setLang(next?.code || (current === 'tr' ? 'ua' : 'tr'));
}

function renderLanguageControls() {
  const languages = window.TurkuaI18n?.getLanguages() || [];
  const container = document.querySelector('.lang-toggle');
  if (!container || !languages.length) return;

  const signature = languages.map(language => `${language.code}:${language.short_label}`).join('|');
  if (container.dataset.languageSignature !== signature) {
    container.replaceChildren(...languages.map(language => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `lang-btn ${language.code}`;
      button.dataset.language = language.code;
      button.textContent = (language.short_label || language.code).toUpperCase();
      button.addEventListener('click', () => setLang(language.code));
      return button;
    }));
    container.dataset.languageSignature = signature;
  }
  syncLanguageControls(window.TurkuaI18n.getLocale());
}

window.addEventListener('turkua:languages-updated', renderLanguageControls);

Object.assign(window, {
  setBottomActive,
  setLang,
  toggleLangBn,
  toggleMobileMenu
});
