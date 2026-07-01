// ── Reklam Modal ──
let _adLastFocus = null;
function openAdModal(name, size, desc, showSlotInfo) {
  if (window.TurkuaSubmissions) {
    window.TurkuaSubmissions.begin('advertising');
  } else {
    window.Turkua.loadFeature('services')
      .then(() => window.TurkuaSubmissions?.begin('advertising'))
      .catch(() => {});
  }
  var show = showSlotInfo !== false;
  var slotBox = document.getElementById('adSlotInfoBox');
  if (slotBox) slotBox.style.display = show ? '' : 'none';
  document.getElementById('modalSlotName').textContent = show ? (name + ' — ' + size) : name;
  document.getElementById('modalSlotBadge').textContent = size;
  document.getElementById('modalSlotDesc').textContent = desc;
  document.getElementById('adFormSection').style.display = '';
  document.getElementById('adSuccess').style.display = 'none';
  document.getElementById('adModal').classList.add('open');
  document.getElementById('adModal').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  _adLastFocus = document.activeElement;
  requestAnimationFrame(() => document.querySelector('.ad-modal-close')?.focus());
}

function closeAdModal(e) {
  if (e.target === document.getElementById('adModal')) closeAdModalDirect();
}
function closeAdModalDirect() {
  document.getElementById('adModal').classList.remove('open');
  document.getElementById('adModal').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  _adLastFocus?.focus?.();
}

function previewLogo(input) {
  const file = input.files[0];
  if (!file) return;
  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type) || file.size > 4 * 1024 * 1024) {
    alert(window.TurkuaI18n?.t('ads.validation.file') || '');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('logoPreview');
    img.src = e.target.result;
    img.style.display = 'block';
    document.querySelector('.logo-upload-icon').textContent = '';
  };
  reader.readAsDataURL(file);
}

async function submitAdForm() {
  try {
    if (!window.TurkuaSubmissions) await window.Turkua.loadFeature('services');
  } catch (error) {
    alert(window.TurkuaI18n?.t('submission.error') || '');
    return;
  }
  const name      = document.getElementById('ad-name').value.trim();
  const whatsapp  = document.getElementById('ad-whatsapp').value.trim();
  const viber     = document.getElementById('ad-viber').value.trim();
  const telegram  = document.getElementById('ad-telegram').value.trim();
  const email     = document.getElementById('ad-email').value.trim();
  const _lang     = document.documentElement.getAttribute('data-lang') || 'tr';
  const sector    = (document.getElementById('ad-sector-' + _lang) || {}).value || '';
  const adFormat  = (document.getElementById('ad-format') || {}).value || 'Statik görsel';
  const message   = document.getElementById('ad-message').value.trim();
  const slot      = document.getElementById('modalSlotName').textContent;
  const errBox    = document.getElementById('ad-contact-error');
  const submitBtn = document.querySelector('.ad-modal-submit');

  const filled = [whatsapp, viber, telegram, email].filter(v => v.length > 0);
  if (!name) { alert(window.TurkuaI18n?.t('ads.validation.name') || ''); return; }
  if (filled.length < 2) {
    errBox.style.display = 'block';
    errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  errBox.style.display = 'none';

  if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = '0.6'; }
  const logoFile = document.getElementById('ad-logo').files && document.getElementById('ad-logo').files[0];

  try {
    await window.TurkuaSubmissions.submit({
      formType: 'advertising',
      locale: _lang,
      name,
      email,
      phone: whatsapp || viber,
      subject: slot,
      message,
      details: {
        sector,
        adFormat,
        slot,
        contacts: { whatsapp, viber, telegram, email }
      }
    }, {
      honeypot: document.getElementById('ad-website')?.value || '',
      attachment: logoFile || null
    });
    document.getElementById('adFormSection').style.display = 'none';
    document.getElementById('adSuccess').style.display = 'block';
  } catch(error) {
    const key = error.messageKey || window.TurkuaSubmissions.messageKey(error.code);
    alert(window.TurkuaI18n?.t(key, _lang) || '');
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = '1'; }
  }
}

window.Turkua.onReady(() => {
  document.querySelectorAll('[data-ad-slot]').forEach(slot => {
    slot.setAttribute('role', 'button');
    slot.setAttribute('tabindex', '0');
    slot.addEventListener('keydown', event => {
      if (slot.classList.contains('has-managed-ad')) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        slot.click();
      }
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById('adModal')?.classList.contains('open')) {
      closeAdModalDirect();
    }
  });
});

Object.assign(window, {
  closeAdModal,
  closeAdModalDirect,
  openAdModal,
  previewLogo,
  submitAdForm
});
