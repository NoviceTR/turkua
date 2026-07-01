(function() {
  const startedAt = new Map();
  let services;
  let connected = false;
  let readyPromise;

  function begin(formType) {
    startedAt.set(formType, Date.now());
  }

  async function functionErrorCode(error) {
    try {
      if (error?.context?.json) {
        const payload = await error.context.json();
        return payload.code || 'server_error';
      }
    } catch (contextError) {}
    return error?.code || 'server_error';
  }

  function messageKey(code) {
    if (code === 'rate_limited') return 'submission.rateLimited';
    if (code === 'duplicate') return 'submission.duplicate';
    return 'submission.error';
  }

  async function submit(payload, options = {}) {
    await connect();
    if (!connected) {
      const error = new Error('Submission service is unavailable.');
      error.code = 'unavailable';
      throw error;
    }
    const bodyPayload = {
      ...payload,
      locale: payload.locale || document.documentElement.dataset.lang || 'tr',
      website: options.honeypot || '',
      startedAt: startedAt.get(payload.formType) || Date.now()
    };
    let body = bodyPayload;
    if (options.attachment) {
      body = new FormData();
      body.append('payload', JSON.stringify(bodyPayload));
      body.append('attachment', options.attachment);
    }
    const { data, error } = await services.functions.invoke('submit-application', { body });
    if (error || !data?.ok) {
      const code = data?.code || await functionErrorCode(error);
      const submissionError = new Error(code);
      submissionError.code = code;
      submissionError.messageKey = messageKey(code);
      throw submissionError;
    }
    begin(payload.formType);
    return data;
  }

  function connect() {
    if (readyPromise) return readyPromise;
    if (window.location.protocol === 'file:') {
      readyPromise = Promise.resolve(false);
      return readyPromise;
    }
    readyPromise = (async() => {
      try {
        const module = await import('./supabase/index.js');
        await module.supabaseReady;
        connected = module.getSupabaseStatus().connected;
        services = module.supabaseServices;
        return connected;
      } catch (error) {
        return false;
      }
    })();
    return readyPromise;
  }

  window.TurkuaSubmissions = {
    get ready() {
      return connect();
    },
    begin,
    submit,
    messageKey
  };
})();
