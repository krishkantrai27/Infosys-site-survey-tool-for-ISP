import { useRef, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'

/**
 * AnimatedGlobe — 3D wireframe globe with light particles traveling
 * in all 8 directions (N, S, E, W, NE, NW, SE, SW) at 1.25x speed.
 * Adapts colors to light/dark theme.
 */
export default function AnimatedGlobe({ opacity = 1, className = '', style = {} }) {
    const canvasRef = useRef(null)
    const animRef = useRef(null)
    const { theme } = useTheme()
    const themeRef = useRef(theme)

    useEffect(() => { themeRef.current = theme }, [theme])

    const getColors = useCallback((currentTheme) => {
        const isDark = currentTheme === 'dark'
        return {
            wireframe: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(79, 70, 229, 0.09)',
            wireframeHighlight: isDark ? 'rgba(255, 255, 255, 0.13)' : 'rgba(79, 70, 229, 0.2)',
            particleCore: isDark ? '#ffffff' : '#6366F1',
            particleGlow: isDark ? 'rgba(100, 220, 255, 0.7)' : 'rgba(99, 102, 241, 0.55)',
            particleTrail: isDark ? 'rgba(100, 220, 255, 0.2)' : 'rgba(99, 102, 241, 0.15)',
            outerGlow: isDark ? 'rgba(100, 220, 255, 0.04)' : 'rgba(79, 70, 229, 0.05)',
            emergingRay: isDark ? 'rgba(100, 220, 255, 0.08)' : 'rgba(99, 102, 241, 0.06)',
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let width, height, centerX, centerY, radius

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            const rect = canvas.parentElement.getBoundingClientRect()
            width = rect.width; height = rect.height
            canvas.width = width * dpr; canvas.height = height * dpr
            canvas.style.width = width + 'px'; canvas.style.height = height + 'px'
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            centerX = width / 2; centerY = height / 2
            radius = Math.min(width, height) * 0.38
        }
        resize()
        window.addEventListener('resize', resize)

        // 8-directional movement definitions (N, NE, E, SE, S, SW, W, NW)
        const DIRECTIONS = [
            { lngDir:  0,    latDir:  1   },  // N  — pure latitude up
            { lngDir:  0.7,  latDir:  0.7 },  // NE
            { lngDir:  1,    latDir:  0   },  // E  — pure longitude
            { lngDir:  0.7,  latDir: -0.7 },  // SE
            { lngDir:  0,    latDir: -1   },  // S  — pure latitude down
            { lngDir: -0.7,  latDir: -0.7 },  // SW
            { lngDir: -1,    latDir:  0   },  // W  — reverse longitude
            { lngDir: -0.7,  latDir:  0.7 },  // NW
        ]

        // 1.25x speed multiplier
        const SPEED_MULT = 1.25
        const BASE_SPEED = 0.006

        const PARTICLE_COUNT = 24
        const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
            const dir = DIRECTIONS[i % 8]
            const speed = (BASE_SPEED + Math.random() * 0.006) * SPEED_MULT
            return {
                lat: (Math.random() - 0.5) * Math.PI,
                lng: Math.random() * Math.PI * 2,
                lngSpeed: dir.lngDir * speed,
                latSpeed: dir.latDir * speed * 0.6,
                size: 1.8 + Math.random() * 2.2,
                brightness: 0.65 + Math.random() * 0.35,
                trail: [],
                pulsePhase: Math.random() * Math.PI * 2,
            }
        })

        let rotation = 0
        const tilt = 0.4

        function project(lat, lng) {
            const cosLat = Math.cos(lat)
            const x3d = cosLat * Math.sin(lng + rotation)
            const y3d = Math.sin(lat)
            const z3d = cosLat * Math.cos(lng + rotation)
            const y3dT = y3d * Math.cos(tilt) - z3d * Math.sin(tilt)
            const z3dT = y3d * Math.sin(tilt) + z3d * Math.cos(tilt)
            return { x: centerX + x3d * radius, y: centerY - y3dT * radius, z: z3dT }
        }

        function drawWireframe(colors) {
            ctx.lineWidth = 0.5
            // Latitude lines
            for (let i = 0; i <= 14; i++) {
                const lat = (i / 14) * Math.PI - Math.PI / 2
                ctx.beginPath()
                for (let j = 0; j <= 72; j++) {
                    const lng = (j / 72) * Math.PI * 2
                    const p = project(lat, lng)
                    ctx.strokeStyle = p.z > 0 ? colors.wireframeHighlight : colors.wireframe
                    j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
                }
                ctx.stroke()
            }
            // Longitude lines
            for (let i = 0; i < 24; i++) {
                const lng = (i / 24) * Math.PI * 2
                ctx.beginPath()
                for (let j = 0; j <= 48; j++) {
                    const lat = (j / 48) * Math.PI - Math.PI / 2
                    const p = project(lat, lng)
                    ctx.strokeStyle = p.z > 0 ? colors.wireframeHighlight : colors.wireframe
                    j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
                }
                ctx.stroke()
            }
        }

        function drawOuterGlow(colors) {
            const g = ctx.createRadialGradient(centerX, centerY, radius * 0.7, centerX, centerY, radius * 1.5)
            g.addColorStop(0, colors.outerGlow)
            g.addColorStop(1, 'transparent')
            ctx.fillStyle = g
            ctx.beginPath()
            ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2)
            ctx.fill()
        }

        // Emerging light rays from globe
        function drawEmergingRays(colors, time) {
            const rayCount = 6
            for (let i = 0; i < rayCount; i++) {
                const angle = (i / rayCount) * Math.PI * 2 + time * 0.2
                const rayLen = radius * (0.3 + 0.15 * Math.sin(time * 1.5 + i))
                const x1 = centerX + Math.cos(angle) * radius
                const y1 = centerY + Math.sin(angle) * radius
                const x2 = centerX + Math.cos(angle) * (radius + rayLen)
                const y2 = centerY + Math.sin(angle) * (radius + rayLen)

                const g = ctx.createLinearGradient(x1, y1, x2, y2)
                g.addColorStop(0, colors.emergingRay)
                g.addColorStop(1, 'transparent')
                ctx.beginPath()
                ctx.strokeStyle = g
                ctx.lineWidth = 1.5
                ctx.moveTo(x1, y1)
                ctx.lineTo(x2, y2)
                ctx.stroke()
            }
        }

        function drawParticles(colors, time) {
            particles.forEach(p => {
                p.lng += p.lngSpeed
                p.lat += p.latSpeed

                // Bounce latitude
                if (p.lat > Math.PI / 2 || p.lat < -Math.PI / 2) {
                    p.latSpeed *= -1
                    p.lat = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, p.lat))
                }
                if (p.lng > Math.PI * 2) p.lng -= Math.PI * 2
                if (p.lng < 0) p.lng += Math.PI * 2

                const pos = project(p.lat, p.lng)
                p.trail.push({ x: pos.x, y: pos.y, z: pos.z })
                if (p.trail.length > 16) p.trail.shift()

                if (pos.z > -0.15) {
                    const pulse = 0.8 + 0.2 * Math.sin(time * 3 + p.pulsePhase)
                    const depthAlpha = Math.max(0.12, (pos.z + 1) / 2) * p.brightness * pulse

                    // Trail
                    if (p.trail.length > 1) {
                        for (let i = 1; i < p.trail.length; i++) {
                            const t = p.trail[i], prev = p.trail[i - 1]
                            if (t.z > -0.15) {
                                const trailAlpha = (i / p.trail.length) * depthAlpha * 0.6
                                ctx.beginPath()
                                ctx.strokeStyle = colors.particleTrail.replace(/[\d.]+\)$/, trailAlpha + ')')
                                ctx.lineWidth = p.size * 0.7
                                ctx.lineCap = 'round'
                                ctx.moveTo(prev.x, prev.y)
                                ctx.lineTo(t.x, t.y)
                                ctx.stroke()
                            }
                        }
                    }

                    // Glow
                    const gg = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, p.size * 8)
                    gg.addColorStop(0, colors.particleGlow.replace(/[\d.]+\)$/, (depthAlpha * 0.5) + ')'))
                    gg.addColorStop(1, 'transparent')
                    ctx.fillStyle = gg
                    ctx.beginPath()
                    ctx.arc(pos.x, pos.y, p.size * 8, 0, Math.PI * 2)
                    ctx.fill()

                    // Core
                    ctx.beginPath()
                    ctx.arc(pos.x, pos.y, p.size * depthAlpha, 0, Math.PI * 2)
                    ctx.fillStyle = colors.particleCore
                    ctx.globalAlpha = depthAlpha
                    ctx.fill()
                    ctx.globalAlpha = 1
                }
            })
        }

        let running = true, time = 0
        function animate() {
            if (!running) return
            const colors = getColors(themeRef.current)
            ctx.clearRect(0, 0, width, height)
            rotation += 0.004
            time += 0.016
            drawOuterGlow(colors)
            drawEmergingRays(colors, time)
            drawWireframe(colors)
            drawParticles(colors, time)
            animRef.current = requestAnimationFrame(animate)
        }
        animate()

        const handleVisibility = () => {
            if (document.hidden) { running = false; if (animRef.current) cancelAnimationFrame(animRef.current) }
            else { running = true; animate() }
        }
        document.addEventListener('visibilitychange', handleVisibility)
        return () => {
            running = false
            if (animRef.current) cancelAnimationFrame(animRef.current)
            window.removeEventListener('resize', resize)
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [getColors])

    return (
        <canvas ref={canvasRef} className={`animated-globe ${className}`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, pointerEvents: 'none', ...style }}
        />
    )
}
