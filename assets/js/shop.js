// ══ TURKUA DROP — ÖN SİPARİŞ/STOK ══════════════════════════
const SHOP_PRODUCTS = Array.isArray(window.SHOP_PRODUCTS) ? window.SHOP_PRODUCTS : [];
const SHOP_PRODUCT_MAP = new Map(SHOP_PRODUCTS.map(product => [product.id, product]));
const SHOP_STOCK_KEY = 'turkua_shop_stock_v1';

let shopCart = [];
const shopEscape = window.Turkua.escapeHtml;

function shopLang() {
  return document.documentElement.getAttribute('data-lang') || 'tr';
}

function shopText(key, fallback = '') {
  return window.TurkuaI18n?.t(key, shopLang(), fallback) || fallback;
}

function getShopStock() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(SHOP_STOCK_KEY) || '{}'); } catch(e) {}
  const stock = {};
  SHOP_PRODUCTS.forEach(p => { stock[p.id] = Number.isFinite(saved[p.id]) ? saved[p.id] : p.baseStock; });
  return stock;
}

function formatTry(amount) {
  if (!amount) return shopText('shop.status.soon');
  return amount.toLocaleString('tr-TR') + ' TL';
}

function renderShop() {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;
  const stock = getShopStock();
  grid.innerHTML = SHOP_PRODUCTS.map(p => {
    const left = stock[p.id] || 0;
    const pct = p.baseStock ? Math.max(0, Math.min(100, (left / p.baseStock) * 100)) : 0;
    const disabled = !p.active || left <= 0;
    const status = shopEscape(p.active ? (left > 0 ? shopText('shop.status.available').replace('{count}', left) : shopText('shop.status.soldout')) : shopText('shop.status.soon'));
    const button = shopEscape(p.active ? shopText('shop.action.add') : shopText('shop.status.soon'));
    const rawTitle = shopText(p.titleKey);
    const title = shopEscape(rawTitle);
    const imageUrl = window.Turkua.safeUrl(p.image);
    const photo = imageUrl ? `<img class="product-photo" src="${shopEscape(imageUrl)}" alt="${shopEscape(rawTitle)}" width="420" height="420" loading="lazy" decoding="async">` : '';
    return `<article class="product-card${p.active ? '' : ' soon'}">
      <div class="product-visual ${p.visual}${imageUrl ? ' has-photo' : ''}">
        ${photo}
        <div class="product-tamga"></div>
        <div class="product-mark">TURKUA</div>
        <div class="product-kind">${shopEscape(shopText(p.kindKey))}</div>
      </div>
      <div class="product-body">
        <div class="product-top">
          <div class="product-title">${title}</div>
          <div class="product-price">${shopEscape(p.price ? formatTry(p.price) : shopText('shop.status.soon'))}</div>
        </div>
        <div class="product-desc">${shopEscape(shopText(p.descKey))}</div>
        <div class="stock-row">
          <span>${status}</span>
          <span class="stock-meter" style="--stock-width:${pct}%"><span></span></span>
        </div>
        <div class="product-actions">
          <input type="number" min="1" max="${Math.max(1, left)}" value="1" id="qty-${p.id}" ${disabled ? 'disabled' : ''}>
          <button class="shop-btn${disabled ? ' secondary' : ''}" type="button" onclick="addToShopCart('${p.id}')" ${disabled ? 'disabled' : ''}>${button}</button>
        </div>
      </div>
    </article>`;
  }).join('');
  renderShopCart();
}

function addToShopCart(id) {
  const product = SHOP_PRODUCT_MAP.get(id);
  if (!product || !product.active) return;
  const stock = getShopStock();
  const input = document.getElementById('qty-' + id);
  const qty = Math.max(1, Math.min(Number(input && input.value) || 1, stock[id] || 0));
  if (!qty) return;
  const existing = shopCart.find(item => item.id === id);
  const inCart = existing ? existing.qty : 0;
  if (inCart + qty > stock[id]) {
    alert(shopText('shop.validation.stock'));
    return;
  }
  if (existing) existing.qty += qty;
  else shopCart.push({ id, qty });
  renderShopCart();
}

function removeFromShopCart(id) {
  shopCart = shopCart.filter(item => item.id !== id);
  renderShopCart();
}

function renderShopCart() {
  const box = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  if (!box || !totalEl) return;
  if (!shopCart.length) {
    box.innerHTML = `<div class="cart-note">${shopText('shop.cart.empty')}</div>`;
    totalEl.textContent = '0 TL';
    return;
  }
  let total = 0;
  box.innerHTML = shopCart.map(item => {
    const p = SHOP_PRODUCT_MAP.get(item.id);
    const line = (p ? p.price : 0) * item.qty;
    total += line;
    return `<div class="cart-item">
      <div><strong>${shopEscape(shopText(p.titleKey))}</strong><br>${item.qty} x ${shopEscape(formatTry(p.price))}</div>
      <button type="button" onclick="removeFromShopCart('${shopEscape(item.id)}')">${shopEscape(shopText('shop.action.remove'))}</button>
    </div>`;
  }).join('');
  totalEl.textContent = formatTry(total);
}

async function submitShopRequest() {
  const lang = shopLang();
  if (!shopCart.length) {
    alert(shopText('shop.validation.empty'));
    return;
  }
  const name = (document.getElementById('shopName') || {}).value || '';
  const contact = (document.getElementById('shopContact') || {}).value || '';
  const note = (document.getElementById('shopNote') || {}).value || '';
  if (!name.trim() || !contact.trim()) {
    alert(shopText('shop.validation.contact'));
    return;
  }
  const items = shopCart.map(item => {
    const p = SHOP_PRODUCT_MAP.get(item.id);
    return {
      id: p.id,
      title: shopText(p.titleKey),
      quantity: item.qty,
      unitPrice: p.price,
      total: p.price * item.qty
    };
  });
  const buttons = document.querySelectorAll('.checkout-form .shop-btn');
  buttons.forEach(button => { button.disabled = true; });
  try {
    await window.TurkuaSubmissions.submit({
      formType: 'shop',
      locale: lang,
      name: name.trim(),
      email: contact.includes('@') ? contact.trim() : '',
      phone: contact.includes('@') ? '' : contact.trim(),
      subject: 'TURKUA Drop Talebi',
      message: note.trim(),
      details: {
        contact: contact.trim(),
        items,
        estimatedTotal: items.reduce((total, item) => total + item.total, 0)
      }
    }, {
      honeypot: document.getElementById('shopWebsite')?.value || ''
    });
    alert(shopText('submission.success'));
    shopCart = [];
    document.getElementById('shopName').value = '';
    document.getElementById('shopContact').value = '';
    document.getElementById('shopNote').value = '';
    renderShop();
  } catch (error) {
    alert(shopText(error.messageKey || window.TurkuaSubmissions.messageKey(error.code)));
  } finally {
    buttons.forEach(button => { button.disabled = false; });
  }
}

window.Turkua.onReady(() => {
  window.TurkuaSubmissions?.begin('shop');
  renderShop();
});
window.addEventListener('turkua:languagechange', renderShop);

Object.assign(window, {
  addToShopCart,
  removeFromShopCart,
  renderShop,
  submitShopRequest
});
