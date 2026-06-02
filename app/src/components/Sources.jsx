/**
 * Sources component - displays research citations used in analysis.
 */
export default function Sources({ analysis }) {
    const sources = [];

    if (analysis?.cognitiveDistortions) {
        analysis.cognitiveDistortions.forEach((distortion) => {
            if (distortion.research) {
                sources.push({
                    citation: distortion.research,
                    context: `Bias detection: ${distortion.bias || 'Cognitive distortion'}`
                });
            }
        });
    }

    if (analysis?.biases) {
        analysis.biases.forEach((bias) => {
            if (bias.research) {
                sources.push({
                    citation: bias.research,
                    context: `Bias framework: ${bias.name || 'Bias'}`
                });
            }
        });
    }

    if (analysis?.crowdWisdom?.source) {
        sources.push({
            citation: analysis.crowdWisdom.source,
            context: 'Statistical data'
        });
    }

    const seen = new Set();
    const uniqueSources = sources.filter((source) => {
        if (seen.has(source.citation)) return false;
        seen.add(source.citation);
        return true;
    });

    if (uniqueSources.length === 0) return null;

    return (
        <section className="sources-section">
            <h3>Research Sources</h3>
            <ul className="sources-list">
                {uniqueSources.map((source, i) => (
                    <li key={`${source.citation}-${i}`} className="source-item">
                        <span className="source-citation">{source.citation}</span>
                        <span className="source-context">{source.context}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
