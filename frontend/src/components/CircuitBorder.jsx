import { useRef, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

/**
 * CircuitBorder — Glowing border with traveling data particles.
 * Canvas extends beyond the card so particle glows aren't clipped.
 */
export default function CircuitBorder({ borderRadius = 16, className = '', style = {} }) {
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
        const PAD = 20 // extra padding so glow isn't clipped

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            const rect = canvas.parentElement.getBoundingClientRect()
            w = rect.width
            h = rect.height
            canvas.width = (w + PAD * 2) * dpr
            canvas.height = (h + PAD * 2) * dpr
            canvas.style.width = (w + PAD * 2) + 'px'
            canvas.style.height = (h + PAD * 2) + 'px'
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        window.addEventListener('resize', resize)

        // Path traces the rounded rectangle of the card
        // All coordinates offset by PAD so the rect sits centered in the canvas
        function getPathPoint(t) {
            const r = borderRadius
            const ox = PAD, oy = PAD // offset
            const cardW = w, cardH = h
            const sH = cardW - 2 * r // straight horizontal
            const sV = cardH - 2 * r // straight vertical
            const cL = Math.PI * r / 2 // corner arc length
            const peri = 2 * sH + 2 * sV + 4 * cL
            let d = ((t % 1) + 1) % 1 * peri

            // Top edge: left to right
            if (d < sH) return { x: ox + r + d, y: oy }
            d -= sH
            // Top-right corner
            if (d < cL) {
                const a = -Math.PI / 2 + (d / cL) * (Math.PI / 2)
                return { x: ox + cardW - r + Math.cos(a) * r, y: oy + r + Math.sin(a) * r }
            }
            d -= cL
            // Right edge: top to bottom
            if (d < sV) return { x: ox + cardW, y: oy + r + d }
            d -= sV
            // Bottom-right corner
            if (d < cL) {
                const a = (d / cL) * (Math.PI / 2)
                return { x: ox + cardW - r + Math.cos(a) * r, y: oy + cardH - r + Math.sin(a) * r }
            }
            d -= cL
            // Bottom edge: right to left
            if (d < sH) return { x: ox + cardW - r - d, y: oy + cardH }
            d -= sH
            // Bottom-left corner
            if (d < cL) {
                const a = Math.PI / 2 + (d / cL) * (Math.PI / 2)
                return { x: ox + r + Math.cos(a) * r, y: oy + cardH - r + Math.sin(a) * r }
            }
            d -= cL
            // Left edge: bottom to top
            if (d < sV) return { x: ox, y: oy + cardH - r - d }
            d -= sV
            // Top-left corner
            if (d < cL) {
                const a = Math.PI + (d / cL) * (Math.PI / 2)
                return { x: ox + r + Math.cos(a) * r, y: oy + r + Math.sin(a) * r }
            }
            return { x: ox + r, y: oy }
        }

        // 10 particles for good coverage
        const P_COUNT = 10
        const ps = Array.from({ length: P_COUNT }, (_, i) => ({
            t: i / P_COUNT,
            speed: 0.0012 + Math.random() * 0.001,
            size: 2.5 + Math.random() * 1.5,
            brightness: 0.8 + Math.random() * 0.2,
        }))

        let running = true, time = 0
        function animate() {
            if (!running) return
            const dk = themeRef.current === 'dark'
            ctx.clearRect(0, 0, w + PAD * 2, h + PAD * 2)
            time += 0.016

            const ox = PAD, oy = PAD

            // Static border glow — visible rounded rect
            ctx.beginPath()
            ctx.roundRect(ox + 0.5, oy + 0.5, w - 1, h - 1, borderRadius)
            ctx.strokeStyle = dk ? 'rgba(100, 220, 255, 0.2)' : 'rgba(99, 102, 241, 0.18)'
            ctx.lineWidth = 1.5
            ctx.stroke()

            // Second inner border for depth
            ctx.beginPath()
            ctx.roundRect(ox + 1.5, oy + 1.5, w - 3, h - 3, borderRadius - 1)
            ctx.strokeStyle = dk ? 'rgba(100, 220, 255, 0.06)' : 'rgba(99, 102, 241, 0.06)'
            ctx.lineWidth = 0.8
            ctx.stroke()

            const coreColor = dk ? '#64DCFF' : '#818CF8'
            const glowPre = dk ? 'rgba(100, 220, 255,' : 'rgba(99, 102, 241,'

            ps.forEach(p => {
                p.t += p.speed
                if (p.t > 1) p.t -= 1
                const pulse = 0.7 + 0.3 * Math.sin(time * 4 + p.t * 25)
                const pos = getPathPoint(p.t)

                // Draw trail — 25 segments behind the particle
                const TRAIL = 25
                for (let i = 1; i <= TRAIL; i++) {
                    let tt = p.t - (i / TRAIL) * 0.06
                    if (tt < 0) tt += 1
                    const pt = getPathPoint(tt)
                    const alpha = ((TRAIL - i) / TRAIL) * 0.5 * p.brightness * pulse
                    const sz = p.size * 0.5 * ((TRAIL - i) / TRAIL)

                    ctx.beginPath()
                    ctx.arc(pt.x, pt.y, sz, 0, Math.PI * 2)
                    ctx.fillStyle = glowPre + alpha + ')'
                    ctx.fill()
                }

                // Outer glow halo
                const glowR = p.size * 10
                const gg = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowR)
                gg.addColorStop(0, glowPre + (0.5 * pulse * p.brightness) + ')')
                gg.addColorStop(0.4, glowPre + (0.15 * pulse * p.brightness) + ')')
                gg.addColorStop(1, 'transparent')
                ctx.fillStyle = gg
                ctx.beginPath()
                ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2)
                ctx.fill()

                // Bright core
                ctx.beginPath()
                ctx.arc(pos.x, pos.y, p.size * pulse, 0, Math.PI * 2)
                ctx.fillStyle = coreColor
                ctx.globalAlpha = p.brightness * pulse
                ctx.fill()

                // White-hot center
                ctx.beginPath()
                ctx.arc(pos.x, pos.y, p.size * pulse * 0.4, 0, Math.PI * 2)
                ctx.fillStyle = '#ffffff'
                ctx.globalAlpha = p.brightness * pulse * 0.8
                ctx.fill()

                ctx.globalAlpha = 1
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
    }, [borderRadius])

    return (
        <canvas
            ref={canvasRef}
            className={`circuit-border ${className}`}
            style={{
                position: 'absolute',
                top: -20,
                left: -20,
                pointerEvents: 'none',
                zIndex: 0,
                ...style,
            }}
        />
    )
}
