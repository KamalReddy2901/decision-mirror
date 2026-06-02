import { useEffect } from 'react';
import AnimatedBackground from '../components/AnimatedBackground';

const RESEARCH = [
    {
        icon: '🧠',
        framework: 'Affect Labeling',
        finding: 'Simply naming your emotions reduces amygdala activity by up to 50%',
        citation: 'Lieberman et al., 2007',
        how: 'Our Emotional Check-In step uses this before any analysis begins'
    },
    {
        icon: '⚖️',
        framework: 'Prospect Theory',
        finding: 'People feel losses ~2x more intensely than equivalent gains, distorting decisions',
        citation: 'Kahneman & Tversky, 1979',
        how: 'We detect loss-framing language and flag it as a cognitive bias'
    },
    {
        icon: '💀',
        framework: 'Pre-Mortem Analysis',
        finding: 'Imagining failure before it happens increases ability to identify threats by 30%',
        citation: 'Gary Klein, 1998',
        how: 'Every analysis includes a pre-mortem for each option'
    },
    {
        icon: '⏰',
        framework: '10-10-10 Rule',
        finding: 'Evaluating decisions across 3 time horizons breaks temporal myopia',
        citation: 'Suzy Welch, 2009',
        how: 'We show how you\'ll feel in 10 minutes, 10 months, and 10 years'
    },
    {
        icon: '🔍',
        framework: 'Cognitive Bias Detection',
        finding: '12+ biases systematically distort everyday decisions without awareness',
        citation: 'Ariely, 2008; Thaler, 2015',
        how: 'We scan your language for bias patterns and show specific reframes'
    },
    {
        icon: '🌡️',
        framework: 'Hot-Cold Empathy Gap',
        finding: 'Decisions made in emotional "hot" states are disproportionately regretted',
        citation: 'Loewenstein, 2005',
        how: 'High emotional scores trigger a cooling period recommendation'
    }
];

const STEPS = [
    { num: '01', title: 'Describe', desc: 'Share your situation naturally — no forms, just your story', icon: '💬' },
    { num: '02', title: 'Check In', desc: 'Rate your emotional state. Naming emotions reduces their power (research-backed)', icon: '🌡️' },
    { num: '03', title: 'Explore', desc: 'Answer 3-4 deep questions that surface hidden fears and assumptions', icon: '🪞' },
    { num: '04', title: 'Reflect', desc: 'Get a comprehensive analysis with 7+ psychology frameworks, not generic advice', icon: '🎯' },
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
        <>
            <AnimatedBackground emotionalScore={40} />
            <div className="landing-page">
                {/* HERO */}
                <section className="hero">
                    <div className="hero-badge">
                        <span className="pulse-dot"></span>
                        Psychology-Powered Decision Intelligence
                    </div>
                    <h1>
                        Your emotions are making<br />
                        the decision for you.<br />
                        <span className="gradient-text">Let's change that.</span>
                    </h1>
                    <p className="hero-subtitle">
                        MirrorWise combines AI with proven psychology frameworks to help you
                        see past cognitive biases, name your emotions, and make decisions you won't regret.
                    </p>
                    <div className="hero-cta-group">
                        <button className="btn btn-primary btn-lg" onClick={() => onNavigate('new-decision')}>
                            Analyze a Decision
                        </button>
                        <button className="btn btn-ghost btn-lg" onClick={() => document.getElementById('science').scrollIntoView({ behavior: 'smooth' })}>
                            See the Science
                        </button>
                    </div>

                    <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', opacity: 0.6, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                        <span>🔒 100% Private — runs in your browser</span>
                        <span>⚡ Powered by Groq + Llama 3</span>
                        <span>🧠 7+ psychology frameworks</span>
                    </div>
                </section>

                {/* HOW IT WORKS — 4 STEPS */}
                <section id="how-it-works" className="science-section reveal">
                    <header className="section-header">
                        <span className="section-label">How It Works</span>
                        <h2 className="section-title">A Guided Thinking Journey, Not a Chat</h2>
                    </header>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-5)', maxWidth: '960px', margin: '0 auto' }}>
                        {STEPS.map((step) => (
                            <div key={step.num} className="glass-card" style={{ padding: 'var(--space-6)', textAlign: 'center', position: 'relative' }}>
                                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>{step.icon}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-primary)', marginBottom: 'var(--space-2)' }}>STEP {step.num}</div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>{step.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* THE SCIENCE */}
                <section id="science" className="science-section reveal">
                    <header className="section-header">
                        <span className="section-label">The Science</span>
                        <h2 className="section-title">Built on Peer-Reviewed Research</h2>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '1rem auto 0', lineHeight: 1.6 }}>
                            Every feature in MirrorWise maps to a specific finding in behavioral psychology and decision science.
                        </p>
                    </header>

                    <div className="science-grid">
                        {RESEARCH.map((item) => (
                            <div key={item.framework} className="glass-card science-card">
                                <div className="science-icon" style={{ background: 'rgba(99, 102, 241, 0.12)' }}>
                                    {item.icon}
                                </div>
                                <h3>{item.framework}</h3>
                                <p>{item.finding}</p>
                                <span className="source">{item.citation}</span>
                                <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'rgba(99, 102, 241, 0.06)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                                    How we use it: {item.how}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* NOT A CHATBOT */}
                <section className="science-section reveal">
                    <header className="section-header">
                        <span className="section-label">Why This Is Different</span>
                        <h2 className="section-title">This Is Not a Chatbot</h2>
                    </header>

                    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
                            <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
                                {[
                                    { chatbot: 'Gives you one AI-generated paragraph', mirror: 'Runs 7+ psychology frameworks: bias detection, pre-mortem, 10-10-10, scenario planning, values alignment, impact scoring, assumptions audit' },
                                    { chatbot: 'No awareness of your emotional state', mirror: 'Emotional Check-In step uses affect labeling research to reduce emotional bias before analysis' },
                                    { chatbot: 'Generic advice anyone could get', mirror: 'Detects YOUR specific cognitive biases from YOUR language patterns, with research citations and personalized reframes' },
                                    { chatbot: 'Single interaction, no structure', mirror: 'Guided 4-step journey: Describe → Check In → Explore → Reflect. Interactive assumptions checklist you can verify.' },
                                ].map((row, i) => (
                                    <div key={i} className="comparison-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
                                        <div style={{ padding: 'var(--space-4)', background: 'rgba(244, 63, 94, 0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 63, 94, 0.1)' }}>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(244, 63, 94, 0.6)', marginBottom: 'var(--space-2)' }}>Typical AI Chat</div>
                                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{row.chatbot}</p>
                                        </div>
                                        <div style={{ padding: 'var(--space-4)', background: 'rgba(99, 102, 241, 0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)', marginBottom: 'var(--space-2)' }}>MirrorWise</div>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{row.mirror}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* FINAL CTA */}
                <section className="reveal" style={{ padding: '4rem 0', textAlign: 'center' }}>
                    <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)', background: 'var(--gradient-surface)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>🪞</div>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: 'var(--space-3)' }}>
                            Ready to see clearly?
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', maxWidth: '500px', margin: '0 auto var(--space-6)', lineHeight: 1.6 }}>
                            The best time to make a clear decision is before emotions take over.
                            The second best time is right now.
                        </p>
                        <button className="btn btn-primary btn-lg" onClick={() => onNavigate('new-decision')}>
                            Analyze My Decision
                        </button>
                        <p style={{ marginTop: 'var(--space-4)', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                            Free. Private. No account needed.
                        </p>
                    </div>
                </section>
            </div>
        </>
    );
}
