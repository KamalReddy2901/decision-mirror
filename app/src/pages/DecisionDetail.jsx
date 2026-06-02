import { lazy, Suspense } from 'react';
import { getDecision } from '../engine/storage';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
const AnalysisView = lazy(() => import('./AnalysisView'));

export default function DecisionDetail({ decisionId, onNavigate }) {
    const decision = decisionId ? getDecision(decisionId) : null;

    if (!decision) {
        return (
            <EmptyState
                message="Decision not found."
                actionLabel="Back to Dashboard"
                onAction={() => onNavigate('dashboard')}
            />
        );
    }

    // Just pass through to AnalysisView - it handles its own header/masthead
    return (
        <Suspense fallback={<LoadingState stages={['Loading analysis...']} />}>
            <AnalysisView
                analysis={decision.analysis}
                title={decision.title}
                description={decision.description}
                onNavigate={onNavigate}
            />
        </Suspense>
    );
}
