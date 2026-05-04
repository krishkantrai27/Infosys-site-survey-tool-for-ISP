import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import getCroppedImg from '../utils/getCroppedImg'
import { X, Minus, Plus } from 'lucide-react'

export default function AvatarUploadModal({ imageSrc, onSave, onClose }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const [isSaving, setIsSaving] = useState(false)

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSave = async () => {
        try {
            setIsSaving(true)
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
            if (croppedImageBlob) {
                // Convert blob to File object to match existing API
                const file = new File([croppedImageBlob], "avatar.jpg", { type: "image/jpeg" })
                await onSave(file)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div 
                    className="relative w-full max-w-md bg-[var(--color-surface)] rounded-2xl overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                    style={{ background: 'var(--color-surface)', borderRadius: '16px' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <h3 className="text-lg font-semibold" style={{ fontSize: '18px', fontWeight: 600 }}>Upload Image</h3>
                        <button onClick={onClose} className="p-1 hover:bg-[var(--color-bg)] rounded-full transition-colors" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <X size={20} color="var(--color-text)" />
                        </button>
                    </div>

                    {/* Cropper Area */}
                    <div className="relative w-full h-[300px] sm:h-[400px] bg-black" style={{ position: 'relative', width: '100%', height: '350px', background: '#000' }}>
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>

                    {/* Footer Controls */}
                    <div className="p-4 flex flex-col gap-4">
                        {/* Zoom Slider */}
                        <div className="flex items-center gap-3">
                            <button onClick={() => setZoom(z => Math.max(1, z - 0.1))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <Minus size={18} color="var(--color-text-muted)" />
                            </button>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full accent-primary"
                                style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                            />
                            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <Plus size={18} color="var(--color-text-muted)" />
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-2">
                            <button 
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-4 py-2 rounded-lg font-medium transition-colors"
                                style={{ 
                                    background: 'var(--color-bg)', border: '1px solid var(--color-border)', 
                                    cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', color: 'var(--color-text)'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 rounded-lg font-medium transition-colors"
                                style={{ 
                                    background: 'var(--color-text)', border: 'none', 
                                    cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', color: 'var(--color-bg)'
                                }}
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
