/**
 * Decision Templates
 * Pre-built frameworks for common decision types.
 */

import { ShoppingCart, Briefcase, MessageSquareWarning, Send, HeartCrack, Handshake } from 'lucide-react';

export const DECISION_TEMPLATES = [
    {
        id: 'purchase',
        name: 'Should I Buy This?',
        icon: ShoppingCart,
        description: 'Evaluate a purchase decision',
        placeholder: 'Describe what you want to buy and why you are considering it...',
        prefillQuestions: [
            'How long have you wanted this? Is it an impulse or a considered desire?',
            'What would you do with the money if you did not buy this?',
            'How will you feel about this purchase in 30 days?'
        ],
        contextPrompt: 'This is a PURCHASE decision. Focus on: value vs. cost, opportunity cost, emotional vs. practical need, buyer\'s remorse risk, and whether this is an impulse or considered purchase.'
    },
    {
        id: 'career',
        name: 'Take the Job?',
        icon: Briefcase,
        description: 'Evaluate a job or career opportunity',
        placeholder: 'Describe the opportunity and your current situation...',
        prefillQuestions: [
            'What are you running FROM vs. running TO? Be honest about the proportion.',
            'Describe your ideal Tuesday at work in this new role. Is it realistic?',
            'Who will be most affected by this change besides you?'
        ],
        contextPrompt: 'This is a CAREER decision. Focus on: growth trajectory, financial implications, work-life balance, alignment with long-term goals, and what they\'re leaving behind.'
    },
    {
        id: 'conversation',
        name: 'Have the Hard Conversation?',
        icon: MessageSquareWarning,
        description: 'Decide whether to have a difficult talk',
        placeholder: 'Describe the conversation you are considering having and with whom...',
        prefillQuestions: [
            'What\'s the best realistic outcome if you have this conversation?',
            'What\'s the cost of NOT having it - what continues or worsens?',
            'Are you ready to hear something you do not want to hear?'
        ],
        contextPrompt: 'This is a COMMUNICATION decision about a difficult conversation. Focus on: timing, emotional readiness of both parties, potential outcomes (best/worst/likely), the cost of silence, and whether the goal is to be heard or to change something.'
    },
    {
        id: 'message',
        name: 'Send This Message?',
        icon: Send,
        description: 'Decide whether to send a text, email, or DM',
        placeholder: 'Describe the message and the context - who it\'s to and why you\'re hesitating...',
        prefillQuestions: [
            'If they screenshot this and showed it to others, would you stand by every word?',
            'What response are you hoping for - and what will you do if you get silence?',
            'Is this message for THEM or for YOU?'
        ],
        contextPrompt: 'This is a COMMUNICATION decision about sending a message. Focus on: tone, timing, the recipient\'s likely state of mind, reversibility (you cannot unsend), and whether the user is seeking closure, validation, or genuine dialogue.'
    },
    {
        id: 'relationship',
        name: 'Stay or Go?',
        icon: HeartCrack,
        description: 'Evaluate a relationship decision',
        placeholder: 'Describe the relationship and what you are considering...',
        prefillQuestions: [
            'If nothing changed in 2 years, would you still stay?',
            'What pattern from past relationships might be repeating here?',
            'Are you making this decision for yourself or to meet someone else\'s expectations?'
        ],
        contextPrompt: 'This is a RELATIONSHIP decision. Focus on: patterns, long-term compatibility, the difference between temporary problems and fundamental misalignment, fear of being alone vs. genuine assessment, and what staying actually looks like day-to-day.'
    },
    {
        id: 'commitment',
        name: 'Make the Commitment?',
        icon: Handshake,
        description: 'Evaluate a big commitment (move, contract, promise)',
        placeholder: 'Describe the commitment and what is holding you back...',
        prefillQuestions: [
            'What would need to be true for you to feel confident about this?',
            'What are you giving up by committing - and can you get it back later?',
            'Are you ready, or are you hoping you\'ll become ready after committing?'
        ],
        contextPrompt: 'This is a COMMITMENT decision. Focus on: reversibility, opportunity cost, whether they are ready now vs. hoping commitment will create readiness, the specific fears underlying hesitation, and the difference between healthy caution and avoidance.'
    }
];

export function getTemplate(id) {
    return DECISION_TEMPLATES.find(t => t.id === id) || null;
}

export function getTemplateContextPrompt(id) {
    const template = getTemplate(id);
    return template?.contextPrompt || '';
}
