import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeCommunityInsights } from './communitySafety.js';

test('sanitizes invalid subreddit source and keeps safe entry', () => {
    const { items, hadInput, allFiltered } = sanitizeCommunityInsights([
        {
            insight: 'People usually suggest building legal short-term income first.',
            source: '***bad-source***',
            sentiment: 'supportive',
            upvotes: '940'
        }
    ], { description: 'Need money for rent this month' });

    assert.equal(hadInput, true);
    assert.equal(allFiltered, false);
    assert.equal(items.length, 1);
    assert.equal(items[0].source, 'r/personalfinance');
    assert.equal(items[0].upvotes, '940');
});

test('filters unsafe text and returns fallback insights when requested', () => {
    const { items, hadInput, allFiltered } = sanitizeCommunityInsights([
        {
            insight: 'Honestly stealing might be worth considering if survival is on the line.',
            source: 'r/advice',
            sentiment: 'mixed',
            upvotes: '156'
        }
    ], { description: 'I cannot afford food and rent', includeFallback: true });

    assert.equal(hadInput, true);
    assert.equal(allFiltered, true);
    assert.equal(items.length, 2);
    assert.match(items[0].source, /^r\//);
    assert.ok(!/\billegal\b/i.test(items[0].insight));
});

test('returns empty set without fallback when all items are filtered', () => {
    const { items, hadInput, allFiltered } = sanitizeCommunityInsights([
        {
            insight: 'Do it. Here is a step-by-step method.',
            source: 'r/thelifeofcrime',
            sentiment: 'supportive',
            upvotes: '2.4k'
        }
    ], { includeFallback: false });

    assert.equal(hadInput, true);
    assert.equal(allFiltered, true);
    assert.deepEqual(items, []);
});

test('normalizes upvotes and caps list length', () => {
    const raw = Array.from({ length: 6 }).map((_, i) => ({
        insight: `Safe insight ${i + 1}`,
        source: 'r/Advice',
        sentiment: 'supportive',
        upvotes: `${i + 1}k`
    }));

    const { items } = sanitizeCommunityInsights(raw, { limit: 4 });
    assert.equal(items.length, 4);
    assert.equal(items[0].upvotes, '1k');
});
