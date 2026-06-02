/**
 * Local Storage Manager
 * Handles all data persistence using localStorage.
 * Zero cost, fully offline-capable.
 */

const STORAGE_KEYS = {
    DECISIONS: 'dm_decisions',
    VALUES: 'dm_user_values',
    SETTINGS: 'dm_settings',
    ONBOARDED: 'dm_onboarded'
};

// ============================================
// DECISIONS
// ============================================

export function saveDecision(decision) {
    const decisions = getDecisions();
    const newDecision = {
        id: generateId(),
        ...decision,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'completed',
        reflection: null
    };
    decisions.unshift(newDecision);
    localStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify(decisions));
    return newDecision;
}

export function getDecisions() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.DECISIONS);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function getDecision(id) {
    return getDecisions().find(d => d.id === id);
}

export function updateDecision(id, updates) {
    const decisions = getDecisions();
    const index = decisions.findIndex(d => d.id === id);
    if (index !== -1) {
        decisions[index] = { ...decisions[index], ...updates, updatedAt: Date.now() };
        localStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify(decisions));
        return decisions[index];
    }
    return null;
}

export function deleteDecision(id) {
    const decisions = getDecisions().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify(decisions));
}

export function clearAllDecisions() {
    localStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify([]));
}

// ============================================
// USER VALUES
// ============================================

export function saveUserValues(values) {
    localStorage.setItem(STORAGE_KEYS.VALUES, JSON.stringify(values));
}

export function getUserValues() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.VALUES);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

// ============================================
// SETTINGS
// ============================================

export function getSettings() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

export function updateSettings(updates) {
    const settings = getSettings();
    const updated = { ...settings, ...updates };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
}

// ============================================
// ONBOARDING
// ============================================

export function isOnboarded() {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
}

export function setOnboarded() {
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
}

// ============================================
// STATISTICS
// ============================================

export function getStats() {
    const decisions = getDecisions();
    const types = {};
    const stakes = { high: 0, medium: 0, low: 0 };
    let totalBiases = 0;

    decisions.forEach(d => {
        if (d.analysis?.category?.type) {
            types[d.analysis.category.type] = (types[d.analysis.category.type] || 0) + 1;
        }
        if (d.analysis?.stakes?.level) {
            stakes[d.analysis.stakes.level]++;
        }
        if (d.analysis?.biases) {
            totalBiases += d.analysis.biases.length;
        }
    });

    return {
        totalDecisions: decisions.length,
        decisionTypes: types,
        stakesDistribution: stakes,
        totalBiasesDetected: totalBiases,
        reflectionsCompleted: decisions.filter(d => d.reflection).length,
        averageBiasesPerDecision: decisions.length > 0
            ? (totalBiases / decisions.length).toFixed(1)
            : 0
    };
}

// ============================================
// COMMITMENTS & REFLECTIONS
// ============================================

export function saveCommitment(decisionId, commitment) {
    return updateDecision(decisionId, {
        commitment: {
            action: commitment.action,
            deadline: commitment.deadline,
            createdAt: Date.now()
        }
    });
}

export function saveReflection(decisionId, reflection) {
    return updateDecision(decisionId, {
        reflection: {
            outcome: reflection.outcome,
            satisfaction: reflection.satisfaction,
            lesson: reflection.lesson,
            surprises: reflection.surprises,
            createdAt: Date.now()
        }
    });
}

export function getDecisionsNeedingReflection() {
    const decisions = getDecisions();
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    return decisions.filter(d =>
        d.commitment &&
        !d.reflection &&
        d.createdAt < threeDaysAgo
    );
}

// ============================================
// EXPORT
// ============================================

export function exportDecisionAsText(decision) {
    const d = decision;
    const a = d.analysis;
    let text = '';

    text += `MIRRORWISE — Analysis Report\n`;
    text += `${'='.repeat(50)}\n\n`;
    text += `Decision: ${d.title}\n`;
    text += `Date: ${new Date(d.createdAt).toLocaleDateString()}\n`;
    text += `Type: ${a.category?.label} | Stakes: ${a.stakes?.label}\n\n`;

    text += `Description:\n${d.description}\n\n`;

    text += `Options Considered:\n`;
    d.options?.forEach((opt, i) => {
        text += `  ${i + 1}. ${opt}\n`;
    });
    text += '\n';

    if (a.biases?.length > 0) {
        text += `Cognitive Biases Detected:\n`;
        a.biases.forEach(b => {
            text += `  ⚠️ ${b.name}: ${b.description}\n`;
            text += `     Reframe: ${b.reframe}\n\n`;
        });
    }

    if (a.recommendation) {
        text += `Conditional Recommendations:\n`;
        a.recommendation.conditions?.forEach(c => {
            text += `  • If your priority is ${c.priority}: "${c.recommendation}"\n`;
        });
        text += '\n';

        text += `Trade-offs:\n`;
        a.recommendation.tradeOffs?.forEach(t => {
            text += `  ⚖️ ${t}\n`;
        });
    }

    text += `\n${'='.repeat(50)}\n`;
    text += `Generated by MirrorWise — mirrorwise.pages.dev\n`;

    return text;
}

// ============================================
// HELPERS
// ============================================

function generateId() {
    return 'dm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}
