import React from 'react'

export default function ResponseForm({ schemaFields, answers, onChange }) {
    const update = (fieldId, val) => onChange({ ...answers, [fieldId]: val })

    if (!schemaFields || schemaFields.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {schemaFields.map(field => (
                <div key={field.fieldId}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        {field.label} {field.required && <span style={{ color: '#EF4444' }}>*</span>}
                    </label>
                    {field.type === 'text' && (
                        <input className="input-field" value={answers[field.fieldId] || ''}
                            onChange={e => update(field.fieldId, e.target.value)} placeholder="Enter text..." />
                    )}
                    {field.type === 'number' && (
                        <input className="input-field" type="number" value={answers[field.fieldId] || ''}
                            onChange={e => update(field.fieldId, e.target.value)} placeholder="Enter number..." />
                    )}
                    {field.type === 'boolean' && (
                        <div style={{ display: 'flex', gap: 12 }}>
                            {['Yes', 'No'].map(opt => (
                                <button key={opt} 
                                    style={{
                                        padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                        border: answers[field.fieldId] === opt ? 'none' : '1px solid var(--color-border)',
                                        background: answers[field.fieldId] === opt ? 'var(--color-primary)' : 'transparent',
                                        color: answers[field.fieldId] === opt ? 'white' : 'var(--color-text-muted)'
                                    }}
                                    onClick={() => update(field.fieldId, opt)}>{opt}</button>
                            ))}
                        </div>
                    )}
                    {field.type === 'select' && (
                        <select className="input-field" value={answers[field.fieldId] || ''}
                            onChange={e => update(field.fieldId, e.target.value)}>
                            <option value="">Select option...</option>
                            {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    )}
                </div>
            ))}
        </div>
    )
}
