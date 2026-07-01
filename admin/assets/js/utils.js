export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

export function localDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('tr-TR');
}

export function createMetric(label, value, detail) {
  const article = document.createElement('article');
  const labelElement = document.createElement('span');
  const valueElement = document.createElement('strong');
  const detailElement = document.createElement('small');
  labelElement.textContent = label;
  valueElement.textContent = value;
  detailElement.textContent = detail;
  article.append(labelElement, valueElement, detailElement);
  return article;
}
