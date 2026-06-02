import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Settings, Menu, X } from 'lucide-react';
import Landing from './pages/Landing';
import NewDecision from './pages/NewDecision';
const AnalysisView = lazy(() => import('./pages/AnalysisView'));
import Dashboard from './pages/Dashboard';
import DecisionDetail from './pages/DecisionDetail';
import ValuesSetup from './pages/ValuesSetup';
import SettingsModal from './components/SettingsModal';
import LoadingState from './components/LoadingState';
import { loadSavedAPIKey } from './engine/aiService';

function getInitialSharedAnalysis() {
  const hash = window.location.hash;
  if (!hash.startsWith('#share=')) return null;
  try {
    const encoded = hash.slice(7);
    const json = decodeURIComponent(escape(atob(encoded)));
    const compact = JSON.parse(json);
    const shared = {
      verdict: compact.v, emotionalInsight: compact.ei, coreConflict: compact.cc,
      devilsAdvocate: compact.da, scores: compact.sc, reflectionQuestion: compact.rq,
      scenarios: compact.s, crowdWisdom: compact.cw, emotionalScore: compact.es,
      isShared: true
    };
    window.history.replaceState(null, '', window.location.pathname);
    return { analysis: shared, title: compact.t, description: compact.d };
  } catch (e) {
    console.warn('Failed to parse shared analysis:', e);
    return null;
  }
}

const _initialShare = getInitialSharedAnalysis();

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('MirrorWise crashed:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', background: 'var(--bg-newsprint)', color: 'var(--text-ink)' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '0.75rem' }}>Something went wrong</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px' }}>An unexpected error occurred. Your saved decisions are safe in local storage.</p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.hash = ''; }} className="btn btn-primary">Go Home</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [page, setPage] = useState(_initialShare ? 'analysis' : 'landing');
  const [currentAnalysis, setCurrentAnalysis] = useState(_initialShare);
  const [viewingDecisionId, setViewingDecisionId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load API key on app start
  useEffect(() => {
    loadSavedAPIKey();
  }, []);

  const navigate = useCallback((pageName, data) => {
    setPage(pageName);
    setMobileMenuOpen(false);
    if (pageName === 'analysis' && data) {
      setCurrentAnalysis(data);
    }
    if (pageName === 'decision-detail' && data) {
      setViewingDecisionId(data);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'landing':
        return <Landing onNavigate={navigate} />;
      case 'new-decision':
        return <NewDecision onNavigate={navigate} />;
      case 'analysis': {
        // Handle both object wrapper and direct analysis for backward compatibility
        const analysisData = currentAnalysis?.analysis || currentAnalysis;
        const analysisTitle = currentAnalysis?.title;
        const analysisDesc = currentAnalysis?.description;

        return (
          <Suspense fallback={<LoadingState stages={['Loading analysis...']} />}>
            <AnalysisView
              analysis={analysisData}
              title={analysisTitle}
              description={analysisDesc}
              onNavigate={navigate}
              onOpenSettings={() => setShowSettings(true)}
            />
          </Suspense>
        );
      }
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />;
      case 'decision-detail':
        return <DecisionDetail decisionId={viewingDecisionId} onNavigate={navigate} />;
      case 'values':
        return <ValuesSetup onNavigate={navigate} />;
      default:
        return <Landing onNavigate={navigate} />;
    }
  };

  return (
    <AppErrorBoundary>
      <div className="app-shell">
        <header className="app-header">
          <div className="header-inner">
            <button className="logo" onClick={() => navigate('landing')} aria-label="Go to home page">
              <span className="logo-text">DECISION MIRROR</span>
            </button>
            <nav>
              <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <li>
                  <button
                    className={`nav-link ${page === 'new-decision' ? 'active' : ''}`}
                    onClick={() => navigate('new-decision')}
                  >
                    New Decision
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-link ${page === 'dashboard' ? 'active' : ''}`}
                    onClick={() => navigate('dashboard')}
                  >
                    History
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-link ${page === 'values' ? 'active' : ''}`}
                    onClick={() => navigate('values')}
                  >
                    My Values
                  </button>
                </li>
                <li>
                  <button
                    className="nav-link"
                    onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }}
                    title="Settings"
                    aria-label="Open settings"
                  >
                    <Settings size={18} />
                  </button>
                </li>
              </ul>
            </nav>
            <button 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </AppErrorBoundary>
  );
}
