import { useRef, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

/**
 * DataFlowBackground — Horizontal streaming data particles effect.
 * Resembles data flowing through fiber optic / network cables.
 * Shows as a subtle watermark behind all dashboard content.
 */
export default function DataFlowBackground({ opacity = 0.15, className = '', style = {} }) {
    const canvasRef = useRef(null)
    const animRef = useRef(null)
    const { theme } = useTheme()
    const themeRef = useRef(theme)
    useEffect(() => { themeRef.current = theme }, [theme])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let w, h

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            const rect = canvas.parentElement.getBoundingClientRect()
            w = rect.width; h = rect.height
            canvas.width = w * dpr; canvas.height = h * dpr
            canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            initStreams()
        }

        // Data streams — horizontal lines with flowing particles
        let streams = []
        function initStreams() {
            streams = []
            const count = Math.floor(h / 10) // denser coverage
            for (let i = 0; i < count; i++) {
                const y = (i / count) * h + (Math.random() - 0.5) * 8
                const speed = (0.4 + Math.random() * 2.0) * 1.5 // 1.5x speed
                const dir = Math.random() > 0.2 ? 1 : -1
                const angle = (Math.random() - 0.5) * 0.15
                streams.push({
                    y, speed: speed * dir, angle,
                    brightness: 0.3 + Math.random() * 0.7,
                    lineWidth: 0.4 + Math.random() * 0.9,
                    // More data packets per stream
                    packets: Array.from(
                        { length: 4 + Math.floor(Math.random() * 6) },
                        () => ({
                            x: Math.random() * (w + 400) - 200,
                            size: 1.2 + Math.random() * 3,
                            trailLen: 25 + Math.random() * 90,
                            glowSize: 4 + Math.random() * 9,
                            pulsePhase: Math.random() * Math.PI * 2,
                            speedMult: (0.6 + Math.random() * 0.8) * 1.5, // 1.5x
                            type: Math.random(),
                        })
                    ),
                })
            }
        }

        resize()
        window.addEventListener('resize', resize)

        let running = true, time = 0
        function animate() {
            if (!running) return
            const dk = themeRef.current === 'dark'
            ctx.clearRect(0, 0, w, h)
            time += 0.016

            // Theme colors — dark: blue/cyan, light: dark brown/amber (visible on beige)
            const colors = dk ? {
                trailA: 'rgba(30, 120, 200,',
                trailB: 'rgba(60, 200, 255,',
                core: 'rgba(100, 220, 255,',
                coreWhite: 'rgba(200, 240, 255,',
                dot: 'rgba(40, 140, 220,',
                line: 'rgba(30, 80, 160,',
                alphaMult: 1.0,
            } : {
                trailA: 'rgba(120, 80, 30,',     // warm brown
                trailB: 'rgba(160, 100, 20,',    // amber
                core: 'rgba(140, 90, 25,',       // rich brown
                coreWhite: 'rgba(180, 120, 40,', // bright amber
                dot: 'rgba(100, 70, 20,',        // dark brown
                line: 'rgba(130, 85, 25,',       // brown line
                alphaMult: 2.5,                  // much stronger for light bg
            }

            streams.forEach(stream => {
                const baseY = stream.y
                const cosA = Math.cos(stream.angle)
                const sinA = Math.sin(stream.angle)

                stream.packets.forEach(pk => {
                    // Move packet
                    pk.x += stream.speed * pk.speedMult
                    // Wrap around
                    if (stream.speed > 0 && pk.x > w + 200) pk.x = -200
                    if (stream.speed < 0 && pk.x < -200) pk.x = w + 200

                    const pulse = 0.6 + 0.4 * Math.sin(time * 3 + pk.pulsePhase)
                    const px = pk.x
                    const py = baseY + sinA * pk.x

                    // Skip if out of vertical bounds
                    if (py < -20 || py > h + 20) return

                    const alpha = stream.brightness * pulse * (colors.alphaMult || 1)

                    // --- Draw motion trail ---
                    const trailDir = stream.speed > 0 ? -1 : 1
                    const segments = 15
                    for (let i = 0; i < segments; i++) {
                        const t = i / segments
                        const tx = px + trailDir * t * pk.trailLen
                        const ty = py + trailDir * t * pk.trailLen * sinA
                        const ta = alpha * (1 - t) * 0.4

                        if (ta < 0.01) continue

                        // Trail line segment
                        if (i > 0) {
                            const ptx = px + trailDir * ((i - 1) / segments) * pk.trailLen
                            const pty = py + trailDir * ((i - 1) / segments) * pk.trailLen * sinA
                            ctx.beginPath()
                            ctx.moveTo(ptx, pty)
                            ctx.lineTo(tx, ty)
                            const trailColor = pk.type > 0.5 ? colors.trailA : colors.trailB
                            ctx.strokeStyle = trailColor + ta + ')'
                            ctx.lineWidth = pk.size * 0.6 * (1 - t * 0.5)
                            ctx.lineCap = 'round'
                            ctx.stroke()
                        }

                        // Dots along trail (data packet visualization)
                        if (pk.type > 0.3 && i % 3 === 0 && t < 0.7) {
                            const dotAlpha = ta * 0.8
                            ctx.beginPath()
                            ctx.arc(tx, ty, pk.size * 0.4 * (1 - t * 0.3), 0, Math.PI * 2)
                            ctx.fillStyle = colors.dot + dotAlpha + ')'
                            ctx.fill()
                        }
                    }

                    // --- Draw glow halo ---
                    const gr = pk.glowSize * pulse
                    const gg = ctx.createRadialGradient(px, py, 0, px, py, gr)
                    gg.addColorStop(0, colors.core + (alpha * 0.5) + ')')
                    gg.addColorStop(0.5, colors.core + (alpha * 0.15) + ')')
                    gg.addColorStop(1, 'transparent')
                    ctx.fillStyle = gg
                    ctx.beginPath()
                    ctx.arc(px, py, gr, 0, Math.PI * 2)
                    ctx.fill()

                    // --- Draw core dot ---
                    ctx.beginPath()
                    ctx.arc(px, py, pk.size * pulse, 0, Math.PI * 2)
                    ctx.fillStyle = colors.core + (alpha * 0.9) + ')'
                    ctx.fill()

                    // --- White-hot center for bright particles ---
                    if (pk.type > 0.6) {
                        ctx.beginPath()
                        ctx.arc(px, py, pk.size * pulse * 0.4, 0, Math.PI * 2)
                        ctx.fillStyle = colors.coreWhite + (alpha * 0.7) + ')'
                        ctx.fill()
                    }

                    // --- Ring effect for larger particles ---
                    if (pk.size > 2.5 && pk.type > 0.4) {
                        ctx.beginPath()
                        ctx.arc(px, py, pk.size * 1.8 * pulse, 0, Math.PI * 2)
                        ctx.strokeStyle = colors.core + (alpha * 0.2) + ')'
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                })
            })

            animRef.current = requestAnimationFrame(animate)
        }
        animate()

        const hv = () => {
            if (document.hidden) { running = false; if (animRef.current) cancelAnimationFrame(animRef.current) }
            else { running = true; animate() }
        }
        document.addEventListener('visibilitychange', hv)
        return () => {
            running = false
            if (animRef.current) cancelAnimationFrame(animRef.current)
            window.removeEventListener('resize', resize)
            document.removeEventListener('visibilitychange', hv)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className={`data-flow-bg ${className}`}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity,
                pointerEvents: 'none',
                ...style,
            }}
        />
    )
}
