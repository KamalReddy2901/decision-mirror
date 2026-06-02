
import { useState } from 'react';
import { saveUserValues, getUserValues } from '../engine/storage';
import { DEFAULT_VALUES } from '../engine/decisionEngine';

export default function ValuesSetup({ onNavigate }) {
    const [values, setValues] = useState(() => getUserValues() || DEFAULT_VALUES);
    const [hasChanged, setHasChanged] = useState(false);

    const handleChange = (key, val) => {
        setValues(prev => ({ ...prev, [key]: parseInt(val, 10) }));
        setHasChanged(true);
    };

    const handleSave = () => {
        saveUserValues(values);
        setHasChanged(false);
        alert('Values saved! Future decisions will be weighed against these priorities.');
    };

    return (
        <div className="values-setup reveal visible">
            <h2>Define Your Core Values</h2>
            <p className="subtitle">
                Your decisions should align with what matters most to you.
                Adjust these sliders to reflect your current life priorities (1-10).
            </p>

            <div className="glass-card">
                <div className="value-slider-group">
                    {Object.entries(values).map(([key, val]) => (
                        <div key={key} className="value-slider">
                            <label className="value-name">{key}</label>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={val}
                                onChange={(e) => handleChange(key, e.target.value)}
                                className="value-range"
                            />
                            <span className="value-score">{val}</span>
                        </div>
                    ))}
                </div>

                <div className="question-actions" style={{ marginTop: '3rem' }}>
                    <button className="btn btn-ghost" onClick={() => onNavigate('dashboard')}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={!hasChanged}
                    >
                        Save Priorities
                    </button>
                </div>
            </div>
        </div>
    );
}
