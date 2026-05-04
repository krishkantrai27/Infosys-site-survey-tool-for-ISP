import { Upload, Trash2, X } from 'lucide-react'

export default function AvatarActionMenu({ onUploadClick, onRemoveClick, onClose, hasExistingPhoto }) {
    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm" style={{
                background: 'var(--color-surface)',
                borderRadius: 16,
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600 }}>Change Profile Photo</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button
                        onClick={onUploadClick}
                        style={{
                            padding: '16px', border: 'none', borderBottom: '1px solid var(--color-border)',
                            background: 'transparent', color: 'var(--color-primary)', fontWeight: 600, fontSize: 15,
                            cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = 'var(--color-bg)'}
                        onMouseOut={(e) => e.target.style.background = 'transparent'}
                    >
                        Upload Photo
                    </button>
                    
                    {hasExistingPhoto && (
                        <button
                            onClick={onRemoveClick}
                            style={{
                                padding: '16px', border: 'none', borderBottom: '1px solid var(--color-border)',
                                background: 'transparent', color: '#EF4444', fontWeight: 600, fontSize: 15,
                                cursor: 'pointer', transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'var(--color-bg)'}
                            onMouseOut={(e) => e.target.style.background = 'transparent'}
                        >
                            Remove Current Photo
                        </button>
                    )}
                    
                    <button
                        onClick={onClose}
                        style={{
                            padding: '16px', border: 'none',
                            background: 'transparent', color: 'var(--color-text)', fontWeight: 400, fontSize: 15,
                            cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = 'var(--color-bg)'}
                        onMouseOut={(e) => e.target.style.background = 'transparent'}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </>
    )
}
