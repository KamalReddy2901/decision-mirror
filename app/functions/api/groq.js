const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 12000; // Increased from 4000 to support long analysis prompts
const MAX_PROMPT_CHARS = 32000; // Increased from 24000
const STREAM_ENABLED = true;

const bucketStore = globalThis.__dmRateLimitBuckets || new Map();
globalThis.__dmRateLimitBuckets = bucketStore;

// API Key rotation - tracks exhausted keys with cooldown
const exhaustedKeys = globalThis.__dmExhaustedKeys || new Map();
globalThis.__dmExhaustedKeys = exhaustedKeys;
const KEY_COOLDOWN_MS = 65000; // 65 seconds cooldown

function json(status, payload, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

function getClientIp(request) {
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp;
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

function enforceRateLimit(ip) {
  const now = Date.now();
  const bucket = bucketStore.get(ip);

  if (!bucket || now > bucket.resetAt) {
    bucketStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return Math.ceil((bucket.resetAt - now) / 1000);
  }

  bucket.count += 1;
  bucketStore.set(ip, bucket);
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

// Get the next available API key (not exhausted or cooldown expired)
function getActiveKey(keys) {
  const now = Date.now();
  for (const key of keys) {
    const exhaustedAt = exhaustedKeys.get(key);
    if (!exhaustedAt || now - exhaustedAt > KEY_COOLDOWN_MS) {
      exhaustedKeys.delete(key);
      return key;
    }
  }
  return null;
}

// Mark a key as exhausted (usually after 429 rate limit)
function rotateKey(keys, usedKey) {
  exhaustedKeys.set(usedKey, Date.now());
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Support both single key (GROQ_API_KEY) and multiple keys (GROQ_API_KEYS)
  const singleKey = String(env?.GROQ_API_KEY || '').trim();
  const multipleKeys = String(env?.GROQ_API_KEYS || '').trim();
  
  let keys = [];
  if (multipleKeys) {
    keys = multipleKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
  } else if (singleKey) {
    keys = [singleKey];
  }
  
  if (keys.length === 0) {
    return json(500, { error: 'Server is not configured with GROQ_API_KEY or GROQ_API_KEYS.' });
  }

  const ip = getClientIp(request);
  const retryAfter = enforceRateLimit(ip);
  if (retryAfter !== null) {
    return json(429, { error: `Rate limit exceeded. Retry in ${retryAfter}s.` }, { 'Retry-After': String(retryAfter) });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON payload.' });
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return json(400, { error: validationError });
  }

  const wantsStream = payload?.stream === true;

  // Try each available key until one succeeds
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = getActiveKey(keys);
    if (!key) {
      // All keys are exhausted
      return json(503, { 
        error: 'All AI servers are busy right now. Please wait a moment and try again.' 
      });
    }

    try {
      const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({ ...payload, stream: wantsStream && STREAM_ENABLED })
      });

      // If rate limited, rotate to next key and try again
      if (upstream.status === 429) {
        rotateKey(keys, key);
        continue;
      }

      if (wantsStream && STREAM_ENABLED) {
        if (!upstream.ok) {
          const errorText = await upstream.text();
          return json(upstream.status, { error: errorText || `Groq request failed (${upstream.status}).` });
        }

        const headers = new Headers(upstream.headers);
        headers.set('Content-Type', 'text/event-stream');
        headers.set('Cache-Control', 'no-cache');
        return new Response(upstream.body, {
          status: 200,
          headers
        });
      }

      const responseText = await upstream.text();
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { error: responseText || `Groq returned status ${upstream.status}` };
      }

      const retryHeader = upstream.headers.get('Retry-After') || upstream.headers.get('retry-after');
      const responseHeaders = retryHeader ? { 'Retry-After': retryHeader } : {};

      if (!upstream.ok) {
        const detail = parsed?.error?.message || parsed?.error || `Groq request failed (${upstream.status}).`;
        return json(upstream.status, { error: detail }, responseHeaders);
      }

      return json(200, parsed, responseHeaders);
    } catch (error) {
      // On network errors, try next key if available
      if (attempt < keys.length - 1) {
        rotateKey(keys, key);
        continue;
      }
      return json(502, {
        error: 'Upstream AI request failed. Please try again in a moment.',
        detail: String(error?.message || error)
      });
    }
  }

  // Should not reach here, but just in case
  return json(503, { 
    error: 'All AI servers are busy right now. Please wait a moment and try again.' 
  });
}
