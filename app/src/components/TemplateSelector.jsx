import { DECISION_TEMPLATES } from '../engine/templates';

export default function TemplateSelector({ onSelect, onSkip }) {
    return (
        <div className="template-selector">
            <h2>What kind of decision?</h2>
            <p className="subtitle">Choose a template for tailored questions, or describe your own.</p>

            <div className="template-grid">
                {DECISION_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                        <button
                            key={template.id}
                            className="template-card"
                            onClick={() => onSelect(template)}
                            type="button"
                        >
                            <span className="template-icon"><Icon size={20} /></span>
                            <span className="template-name">{template.name}</span>
                            <span className="template-desc">{template.description}</span>
                        </button>
                    );
                })}
            </div>

            <button className="btn btn-ghost template-skip" onClick={onSkip} type="button">
                Skip - I'll describe my own
            </button>
        </div>
    );
}
