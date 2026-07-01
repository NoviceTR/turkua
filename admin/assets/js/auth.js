import {
  getSupabaseStatus,
  supabaseReady,
  supabaseServices
} from '../../../assets/js/supabase/index.js';

const form = document.getElementById('loginForm');
const email = document.getElementById('loginEmail');
const password = document.getElementById('loginPassword');
const message = document.getElementById('loginMessage');
const showPassword = document.getElementById('showPassword');
const submitButton = form.querySelector('button[type="submit"]');

function renderStatus(status) {
  const dot = document.getElementById('backendStatusDot');
  const label = document.getElementById('backendStatusLabel');
  const detail = document.getElementById('backendStatusDetail');

  dot.classList.toggle('warning', !status.connected);
  label.textContent = status.connected ? 'Supabase hazır' : 'Supabase';
  detail.textContent = status.connected
    ? 'Authentication bağlı'
    : status.configured
      ? 'Bağlantı kurulamadı'
      : 'Yapılandırma bekleniyor';
}

showPassword.addEventListener('change', () => {
  password.type = showPassword.checked ? 'text' : 'password';
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  message.textContent = '';
  submitButton.disabled = true;

  try {
    const { error } = await supabaseServices.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value
    });
    if (error) throw error;
    window.location.href = 'dashboard.html';
  } catch (error) {
    message.textContent = 'Giriş başarısız. E-posta, şifre ve Supabase ayarlarını kontrol edin.';
    submitButton.disabled = false;
  }
});

async function start() {
  await supabaseReady;
  const status = getSupabaseStatus();
  renderStatus(status);

  if (!status.connected) {
    submitButton.disabled = true;
    message.textContent = status.configured
      ? 'Supabase istemcisi başlatılamadı.'
      : 'Bağlantı için Supabase URL ve publishable key ekleyin.';
    return;
  }

  const { data } = await supabaseServices.auth.getSession();
  if (data.session) window.location.replace('dashboard.html');
}

start();
