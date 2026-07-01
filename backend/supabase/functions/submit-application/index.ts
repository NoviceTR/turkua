import { createClient } from 'npm:@supabase/supabase-js@2.105.3';

type SubmissionPayload = {
  formType?: 'contact' | 'advertising' | 'shop';
  locale?: string;
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  details?: Record<string, unknown>;
  website?: string;
  startedAt?: number;
};

const encoder = new TextEncoder();
const allowedFormTypes = new Set(['contact', 'advertising', 'shop']);
const allowedFileTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

function response(origin: string, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Vary': 'Origin'
    }
  });
}

function allowedOrigin(request: Request) {
  const origin = request.headers.get('origin') || '*';
  const configured = (Deno.env.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  if (!configured.length) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? origin : '';
  }
  if (configured.includes('*')) return origin;
  return configured.includes(origin) ? origin : '';
}

function secretKey() {
  const modern = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modern) {
    const keys = JSON.parse(modern);
    if (keys.default) return keys.default;
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}

function clean(value: unknown, maximum: number) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maximum);
}

function escapeTelegram(value: unknown) {
  return clean(value, 1000)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function hash(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function spamReason(payload: SubmissionPayload) {
  if (clean(payload.website, 200)) return 'honeypot';
  const startedAt = Number(payload.startedAt || 0);
  const elapsed = Date.now() - startedAt;
  if (!startedAt || elapsed < 2500 || elapsed > 24 * 60 * 60 * 1000) return 'timing';

  const name = clean(payload.name, 120);
  const message = clean(payload.message, 5000);
  const subject = clean(payload.subject, 180);
  if (String(payload.name ?? '').length > 120) return 'length';
  if (String(payload.message ?? '').length > 5000) return 'length';
  if (String(payload.subject ?? '').length > 180) return 'length';
  if (JSON.stringify(payload.details || {}).length > 12000) return 'details';
  if (name.length < 2 || name.length > 120) return 'name';
  if (!message && payload.formType !== 'shop') return 'message';
  if (message.length > 5000 || subject.length > 180) return 'length';

  const combined = `${subject} ${message}`.toLocaleLowerCase('en');
  const links = combined.match(/https?:\/\/|www\./g) || [];
  if (links.length > 2) return 'links';
  if (/(.)\1{14,}/u.test(combined)) return 'repetition';
  if (/\b(casino|viagra|crypto giveaway|seo backlinks|guest post)\b/i.test(combined)) return 'keyword';

  const email = clean(payload.email, 180);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'email';
  return '';
}

async function parseRequest(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const payload = JSON.parse(String(form.get('payload') || '{}')) as SubmissionPayload;
    const attachment = form.get('attachment');
    return {
      payload,
      attachment: attachment instanceof File && attachment.size ? attachment : null
    };
  }
  return {
    payload: await request.json() as SubmissionPayload,
    attachment: null
  };
}

async function sendTelegram(payload: SubmissionPayload, submissionId: string) {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!token || !chatId) return { sent: false, error: 'Telegram secrets are not configured.' };

  const details = Object.entries(payload.details || {})
    .slice(0, 12)
    .map(([key, value]) => `<b>${escapeTelegram(key)}:</b> ${escapeTelegram(
      typeof value === 'object' ? JSON.stringify(value) : value
    )}`)
    .join('\n');
  const text = [
    '<b>TürkUA Yeni Başvuru</b>',
    `<b>Tür:</b> ${escapeTelegram(payload.formType)}`,
    `<b>Ad:</b> ${escapeTelegram(payload.name)}`,
    payload.email ? `<b>E-posta:</b> ${escapeTelegram(payload.email)}` : '',
    payload.phone ? `<b>Telefon:</b> ${escapeTelegram(payload.phone)}` : '',
    payload.subject ? `<b>Konu:</b> ${escapeTelegram(payload.subject)}` : '',
    payload.message ? `<b>Mesaj:</b> ${escapeTelegram(payload.message)}` : '',
    details,
    `<code>${escapeTelegram(submissionId)}</code>`
  ].filter(Boolean).join('\n');

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4096),
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
    const result = await telegramResponse.json();
    return {
      sent: telegramResponse.ok && result.ok === true,
      error: telegramResponse.ok && result.ok === true ? '' : clean(result.description, 500)
    };
  } catch (error) {
    return { sent: false, error: clean(error instanceof Error ? error.message : error, 500) };
  }
}

Deno.serve(async request => {
  const origin = allowedOrigin(request);
  if (!origin) return response('null', 403, { ok: false, code: 'origin' });
  if (request.method === 'OPTIONS') return response(origin, 200, { ok: true });
  if (request.method !== 'POST') return response(origin, 405, { ok: false, code: 'method' });

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 6 * 1024 * 1024) {
    return response(origin, 413, { ok: false, code: 'payload_too_large' });
  }

  try {
    const { payload, attachment } = await parseRequest(request);
    if (!allowedFormTypes.has(payload.formType || '')) {
      return response(origin, 400, { ok: false, code: 'invalid_form' });
    }
    const spam = spamReason(payload);
    if (spam) return response(origin, 400, { ok: false, code: 'spam' });
    if (attachment && (
      attachment.size > 4 * 1024 * 1024 ||
      !allowedFileTypes.has(attachment.type)
    )) {
      return response(origin, 400, { ok: false, code: 'invalid_attachment' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const key = secretKey();
    if (!supabaseUrl || !key) throw new Error('Supabase server credentials are unavailable.');
    const admin = createClient(supabaseUrl, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('cf-connecting-ip') ||
      'unknown';
    const salt = Deno.env.get('SUBMISSION_HASH_SALT') || '';
    if (!salt) throw new Error('SUBMISSION_HASH_SALT is unavailable.');
    const ipHash = await hash(`${salt}:${forwarded}`);
    const dedupeHash = await hash([
      salt,
      ipHash,
      payload.formType,
      clean(payload.email || payload.phone, 180),
      clean(payload.subject, 180),
      clean(payload.message, 1000)
    ].join(':'));
    const rateLimit = payload.formType === 'advertising' ? 3 : payload.formType === 'shop' ? 10 : 5;

    const { data, error } = await admin.rpc('create_public_submission', {
      p_form_type: payload.formType,
      p_locale: clean(payload.locale, 10) || 'tr',
      p_name: clean(payload.name, 120),
      p_email: clean(payload.email, 180),
      p_phone: clean(payload.phone, 80),
      p_subject: clean(payload.subject, 180),
      p_message: clean(payload.message, 5000),
      p_details: payload.details || {},
      p_ip_hash: ipHash,
      p_dedupe_hash: dedupeHash,
      p_user_agent: clean(request.headers.get('user-agent'), 500),
      p_rate_limit: rateLimit
    });
    if (error) throw error;
    const result = data?.[0];
    if (!result?.accepted) {
      const status = result?.reason === 'rate_limited' ? 429 : 409;
      return response(origin, status, { ok: false, code: result?.reason || 'rejected' });
    }

    let attachmentPath = '';
    let attachmentStored = false;
    if (attachment) {
      const extension = clean(attachment.name.split('.').pop(), 10).toLocaleLowerCase('en') || 'file';
      attachmentPath = `${result.submission_id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await admin.storage
        .from('submissions')
        .upload(attachmentPath, attachment, {
          contentType: attachment.type,
          cacheControl: '3600',
          upsert: false
        });
      if (!uploadError) {
        attachmentStored = true;
        await admin.from('submissions').update({
          attachment_path: attachmentPath,
          attachment_name: clean(attachment.name, 180)
        }).eq('id', result.submission_id);
      }
    }

    const telegram = await sendTelegram(payload, result.submission_id);
    await admin.from('submissions').update({
      telegram_notified: telegram.sent,
      telegram_error: telegram.error || null
    }).eq('id', result.submission_id);

    return response(origin, 201, {
      ok: true,
      submissionId: result.submission_id,
      telegramNotified: telegram.sent,
      attachmentStored
    });
  } catch (error) {
    console.error('submit-application failed', error);
    return response(origin, 500, { ok: false, code: 'server_error' });
  }
});
