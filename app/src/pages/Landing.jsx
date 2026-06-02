/**
 * Landing.jsx — Editorial transformation
 * 
 * Literary print aesthetic: masthead hero, numbered ledger, two-column research index,
 * broadsheet comparison table. No emojis, no gradients, no glass.
 */

import { useEffect } from 'react';
import { CascadeItem } from '../components/Motion';

const RESEARCH = [
    {
        framework: 'Affect Labeling',
        finding: 'Simply naming your emotions reduces amygdala activity by up to 50%',
        citation: 'Lieberman et al., 2007',
        how: 'Our Emotional Check-In step uses this before any analysis begins'
    },
    {
        framework: 'Prospect Theory',
        finding: 'People feel losses approximately twice as intensely as equivalent gains, distorting decisions',
        citation: 'Kahneman & Tversky, 1979',
        how: 'We detect loss-framing language and flag it as a cognitive bias'
    },
    {
        framework: 'Pre-Mortem Analysis',
        finding: 'Imagining failure before it happens increases ability to identify threats by 30%',
        citation: 'Gary Klein, 1998',
        how: 'Every analysis includes a pre-mortem for each option'
    },
    {
        framework: '10-10-10 Rule',
        finding: 'Evaluating decisions across three time horizons breaks temporal myopia',
        citation: 'Suzy Welch, 2009',
        how: 'We show how you will feel in 10 minutes, 10 months, and 10 years'
    },
    {
        framework: 'Cognitive Bias Detection',
        finding: 'More than twelve biases systematically distort everyday decisions without awareness',
        citation: 'Ariely, 2008; Thaler, 2015',
        how: 'We scan your language for bias patterns and show specific reframes'
    },
    {
        framework: 'Hot-Cold Empathy Gap',
        finding: 'Decisions made in emotional "hot" states are disproportionately regretted',
        citation: 'Loewenstein, 2005',
        how: 'High emotional scores trigger a cooling period recommendation'
    }
];

const STEPS = [
    { num: '01', title: 'Describe', desc: 'Share your situation naturally — no forms, just your story' },
    { num: '02', title: 'Check In', desc: 'Rate your emotional state. Naming emotions reduces their power (research-backed)' },
    { num: '03', title: 'Explore', desc: 'Answer 3-4 deep questions that surface hidden fears and assumptions' },
    { num: '04', title: 'Reflect', desc: 'Get a comprehensive analysis with 7+ psychology frameworks, not generic advice' },
];

export default function Landing({ onNavigate }) {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
            { threshold: 0.1 }
        );
        document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="landing-page">
            {/* HERO — Editorial Masthead */}
            <section style={{ padding: 'var(--space-10) 0 var(--space-9)', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                <CascadeItem delay={0}>
                    <p className="eyebrow" style={{ marginBottom: 'var(--space-5)' }}>
                        Psychology-Powered Decision Intelligence
                    </p>
                </CascadeItem>

                <CascadeItem delay={0.1}>
                    <h1 style={{ marginBottom: 'var(--space-5)' }}>
                        Your emotions are making the decision for you. <span style={{ fontStyle: 'italic', color: 'var(--accent-vermilion)' }}>Let's change that.</span>
                    </h1>
                </CascadeItem>

                <CascadeItem delay={0.2}>
                    <div style={{ width: '80px', height: '2px', background: 'var(--accent-vermilion)', margin: '0 auto var(--space-5)' }} />
                    <p style={{ fontSize: '1.125rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 'var(--space-7)', maxWidth: '600px', margin: '0 auto var(--space-7)' }}>
                        Decision Mirror combines AI with proven psychology frameworks to help you see past cognitive biases, name your emotions, and make decisions you won't regret.
                    </p>
                </CascadeItem>

                <CascadeItem delay={0.3}>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary btn-lg" onClick={() => onNavigate('new-decision')}>
                            Analyze a Decision
                        </button>
                        <button className="btn btn-ghost btn-lg" onClick={() => document.getElementById('science').scrollIntoView({ behavior: 'smooth' })}>
                            See the Science
                        </button>
                    </div>
                </CascadeItem>

                <div style={{ marginTop: 'var(--space-7)', display: 'flex', justifyContent: 'center', gap: 'var(--space-6)', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                    <span>100% Private — runs in your browser</span>
                    <span>Powered by Groq + Llama 3</span>
                    <span>7+ psychology frameworks</span>
                </div>
            </section>

            {/* HOW IT WORKS — Numbered Ledger (single column ruled list) */}
            <section id="how-it-works" style={{ padding: 'var(--space-9) 0', maxWidth: '700px', margin: '0 auto' }} className="reveal">
                <header style={{ textAlign: 'center', marginBottom: 'var(--space-7)' }}>
                    <p className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>How It Works</p>
                    <h2>A Guided Thinking Journey, Not a Chat</h2>
                </header>

                <div style={{ display: 'grid', gap: '0' }}>
                    {STEPS.map((step, i) => (
                        <div 
                            key={step.num} 
                            style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '60px 1fr', 
                                gap: 'var(--space-5)', 
                                padding: 'var(--space-5) 0',
                                borderTop: i === 0 ? '1px solid var(--border-hairline)' : 'none',
                                borderBottom: '1px solid var(--border-hairline)',
                            }}
                        >
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 300, color: 'var(--accent-vermilion)', textAlign: 'right' }}>
                                {step.num}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: 'var(--space-2)' }}>
                                    {step.title}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* THE SCIENCE — Two-column editorial index */}
            <section id="science" style={{ padding: 'var(--space-9) 0' }} className="reveal">
                <header style={{ textAlign: 'center', marginBottom: 'var(--space-8)', maxWidth: '700px', margin: '0 auto var(--space-8)' }}>
                    <p className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>The Science</p>
                    <h2 style={{ marginBottom: 'var(--space-4)' }}>Built on Peer-Reviewed Research</h2>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Every feature in Decision Mirror maps to a specific finding in behavioral psychology and decision science.
                    </p>
                </header>

                {/* PULL-QUOTE (asymmetric break) */}
                <div style={{ 
                    maxWidth: '600px', 
                    margin: '0 auto var(--space-8)', 
                    padding: 'var(--space-6) 0 var(--space-6) var(--space-7)', 
                    borderLeft: '3px solid var(--accent-vermilion)',
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: '1.25rem',
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)'
                }}>
                    "Simply naming your emotions reduces amygdala activity by up to 50%"
                    <div style={{ marginTop: 'var(--space-2)', fontSize: '0.875rem', fontStyle: 'normal', fontFamily: 'var(--font-body)', color: 'var(--text-tertiary)' }}>
                        — Lieberman et al., 2007
                    </div>
                </div>

                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {RESEARCH.map((item, i) => (
                        <div 
                            key={item.framework}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 2fr',
                                gap: 'var(--space-6)',
                                padding: 'var(--space-5) 0',
                                borderTop: i === 0 ? '1px solid var(--border-hairline)' : 'none',
                                borderBottom: '1px solid var(--border-hairline)',
                            }}
                        >
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                    {item.framework}
                                </h3>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                    {item.citation}
                                </p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.6 }}>
                                    {item.finding}
                                </p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', paddingLeft: 'var(--space-4)', borderLeft: '2px solid var(--border-hairline)' }}>
                                    How we use it: {item.how}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* NOT A CHATBOT — Broadsheet table */}
            <section style={{ padding: 'var(--space-9) 0' }} className="reveal">
                <header style={{ textAlign: 'center', marginBottom: 'var(--space-7)' }}>
                    <p className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>Why This Is Different</p>
                    <h2>This Is Not a Chatbot</h2>
                </header>

                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0 }}>
                        {/* Left column header */}
                        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-hairline)', borderBottom: '1px solid var(--border-hairline)' }}>
                            <p className="eyebrow" style={{ color: 'var(--text-tertiary)' }}>Typical AI Chat</p>
                        </div>

                        {/* Center divider */}
                        <div style={{ background: 'var(--border-hairline)' }} />

                        {/* Right column header */}
                        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-hairline)', borderBottom: '1px solid var(--border-hairline)' }}>
                            <p className="eyebrow" style={{ color: 'var(--accent-vermilion)' }}>Decision Mirror</p>
                        </div>

                        {/* Rows */}
                        {[
                            { chatbot: 'Gives you one AI-generated paragraph', mirror: 'Runs 7+ psychology frameworks: bias detection, pre-mortem, 10-10-10, scenario planning, values alignment, impact scoring, assumptions audit' },
                            { chatbot: 'No awareness of your emotional state', mirror: 'Emotional Check-In step uses affect labeling research to reduce emotional bias before analysis' },
                            { chatbot: 'Generic advice anyone could get', mirror: 'Detects YOUR specific cognitive biases from YOUR language patterns, with research citations and personalized reframes' },
                            { chatbot: 'Single interaction, no structure', mirror: 'Guided 4-step journey: Describe → Check In → Explore → Reflect. Interactive assumptions checklist you can verify.' },
                        ].map((row, i) => (
                            <>
                                <div key={`left-${i}`} style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-hairline)' }}>
                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{row.chatbot}</p>
                                </div>
                                <div style={{ background: 'var(--border-hairline)' }} />
                                <div key={`right-${i}`} style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-hairline)' }}>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{row.mirror}</p>
                                </div>
                            </>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="reveal" style={{ padding: 'var(--space-9) 0 var(--space-10)', textAlign: 'center' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)', border: '1px solid var(--border-hairline)' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: 'var(--space-4)' }}>
                        Ready to see clearly?
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
                        The best time to make a clear decision is before emotions take over. The second best time is right now.
                    </p>
                    <button className="btn btn-primary btn-lg" onClick={() => onNavigate('new-decision')}>
                        Analyze My Decision
                    </button>
                    <p style={{ marginTop: 'var(--space-5)', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                        Free. Private. No account needed.
                    </p>
                </div>
            </section>
        </div>
    );
}
