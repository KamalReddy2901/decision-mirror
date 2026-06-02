const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 4000;
const MAX_PROMPT_CHARS = 24000;

const requestBuckets = new Map();

function json(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload));
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function enforceRateLimit(ip) {
  const now = Date.now();
  const bucket = requestBuckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    requestBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return Math.ceil((bucket.resetAt - now) / 1000);
  }

  bucket.count += 1;
  requestBuckets.set(ip, bucket);
  return null;
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') return 'Missing request body.';

  const { messages, model, temperature, max_tokens: maxTokens } = payload;

  if (!Array.isArray(messages) || messages.length === 0) return 'messages must be a non-empty array.';
  if (messages.length > MAX_MESSAGES) return `Too many messages. Maximum is ${MAX_MESSAGES}.`;

  let totalChars = 0;
  for (const item of messages) {
    if (!item || typeof item !== 'object') return 'Each message must be an object.';
    if (!['system', 'user', 'assistant'].includes(item.role)) return 'Invalid message role.';
    const content = String(item.content || '');
    if (!content.trim()) return 'Message content cannot be empty.';
    if (content.length > MAX_MESSAGE_CHARS) return `A message exceeds ${MAX_MESSAGE_CHARS} characters.`;
    totalChars += content.length;
  }

  if (totalChars > MAX_PROMPT_CHARS) return `Prompt is too large. Maximum ${MAX_PROMPT_CHARS} characters.`;
  if (typeof model !== 'string' || !model.trim()) return 'model is required.';

  if (temperature !== undefined) {
    const t = Number(temperature);
    if (!Number.isFinite(t) || t < 0 || t > 1.5) return 'temperature must be between 0 and 1.5.';
  }

  if (maxTokens !== undefined) {
    const mt = Number(maxTokens);
    if (!Number.isFinite(mt) || mt <= 0 || mt > 6000) return 'max_tokens must be between 1 and 6000.';
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  const serverKey = String(globalThis?.process?.env?.GROQ_API_KEY || '').trim();
  if (!serverKey) {
    return json(res, 500, { error: 'Server is not configured with GROQ_API_KEY.' });
  }

  const ip = getClientIp(req);
  const retryAfter = enforceRateLimit(ip);
  if (retryAfter !== null) {
    res.setHeader('Retry-After', String(retryAfter));
    return json(res, 429, { error: `Rate limit exceeded. Retry in ${retryAfter}s.` });
  }

  let payload;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  } catch {
    return json(res, 400, { error: 'Invalid JSON payload.' });
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return json(res, 400, { error: validationError });
  }

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverKey}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await upstream.text();
    const retryHeader = upstream.headers.get('retry-after');
    if (retryHeader) res.setHeader('Retry-After', retryHeader);

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { error: responseText || `Groq returned status ${upstream.status}` };
    }

    if (!upstream.ok) {
      const detail = parsed?.error?.message || parsed?.error || `Groq request failed (${upstream.status}).`;
      return json(res, upstream.status, { error: detail });
    }

    return json(res, 200, parsed);
  } catch (error) {
    return json(res, 502, {
      error: 'Upstream AI request failed. Please try again in a moment.',
      detail: String(error?.message || error)
    });
  }
}
