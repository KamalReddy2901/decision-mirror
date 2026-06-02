const UNSAFE_COMMUNITY_SOURCE_RE = /(crime|criminal|thief|theft|steal|rob|burglary|fraud|scam|violence|assault|weapon|drug|piracy|dark\s?web)/i;
const UNSAFE_COMMUNITY_TEXT_RE = /\b(thief|steal(?:ing|s)?|stole|rob(?:bery|bing)?|burglary|crime|criminal|fraud|scam|violence|assault|harm|hurt|kill|weapon|illegal|drug\s+dealing|money\s+laundering|forgery|extortion)\b/i;
const VALID_SUBREDDIT_RE = /^[A-Za-z0-9_]{2,21}$/;

function normalizeUpvotes(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (/^\d+(\.\d+)?k$/i.test(text)) return text.toLowerCase();
    if (/^\d+$/.test(text)) return text;
    return '';
}

function getSafeFallbackSource(description = '') {
    const lower = description.toLowerCase();
    if (/\b(money|rent|debt|bills|survival|afford|job|income)\b/.test(lower)) return 'r/personalfinance';
    if (/\b(law|legal|arrest|police|court|charges?)\b/.test(lower)) return 'r/legaladvice';
    if (/\b(relationship|partner|marriage|breakup|family)\b/.test(lower)) return 'r/relationships';
    if (/\b(mental|anxiety|depression|stress|panic)\b/.test(lower)) return 'r/mentalhealth';
    return 'r/Advice';
}

function buildFallbackCommunityInsights(description = '') {
    return [
        {
            insight: 'People in difficult situations often warn that short-term risky choices can create long-term legal and emotional fallout. Lawful support usually protects your future options better.',
            source: getSafeFallbackSource(description),
            sentiment: 'cautionary',
            upvotes: '1.2k'
        },
        {
            insight: 'A common recommendation is to seek immediate practical help first: community aid, financial assistance, legal guidance, and safer income options.',
            source: 'r/Advice',
            sentiment: 'supportive',
            upvotes: '847'
        }
    ];
}

export function sanitizeCommunityInsights(rawInsights, options = {}) {
    const { description = '', limit = 4, includeFallback = false } = options;
    const input = Array.isArray(rawInsights) ? rawInsights : [];

    const items = input
        .map((item) => {
            const insight = String(item?.insight || '').trim();
            const rawSource = String(item?.source || '').trim();
            const normalizedSource = rawSource.replace(/^r\//i, '').trim();
            const source = normalizedSource && VALID_SUBREDDIT_RE.test(normalizedSource)
                ? `r/${normalizedSource}`
                : getSafeFallbackSource(description);

            if (!insight) return null;
            if (UNSAFE_COMMUNITY_TEXT_RE.test(insight)) return null;
            if (UNSAFE_COMMUNITY_SOURCE_RE.test(source)) return null;

            return {
                insight,
                source,
                sentiment: ['supportive', 'cautionary', 'mixed'].includes(item?.sentiment) ? item.sentiment : 'mixed',
                upvotes: normalizeUpvotes(item?.upvotes)
            };
        })
        .filter(Boolean)
        .slice(0, limit);

    if (items.length > 0) {
        return { items, hadInput: input.length > 0, allFiltered: false };
    }

    if (includeFallback && input.length > 0) {
        return {
            items: buildFallbackCommunityInsights(description).slice(0, limit),
            hadInput: true,
            allFiltered: true
        };
    }

    return { items: [], hadInput: input.length > 0, allFiltered: input.length > 0 };
}
