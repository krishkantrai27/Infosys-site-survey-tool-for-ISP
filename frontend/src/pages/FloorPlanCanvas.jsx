import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import { ArrowLeft, Pentagon, Square, MapPin, Save, Trash2, Layers, MousePointer, AlertTriangle, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import ErrorBoundary from '../components/ErrorBoundary'
import SpaceDetailsPanel from '../components/SpaceDetailsPanel'
import RfHeatmaps from '../components/RfHeatmaps'

// ── GeoJSON → WKT converters ──────────────────────────────────────
function coordsToWkt(coords) {
    return coords.map(c => `${c[0]} ${c[1]}`).join(', ')
}

function geojsonToWkt(geometry) {
    const { type, coordinates } = geometry
    if (type === 'Point') return `POINT (${coordinates[0]} ${coordinates[1]})`
    if (type === 'Polygon') {
        const rings = coordinates.map(ring => `(${coordsToWkt(ring)})`).join(', ')
        return `POLYGON (${rings})`
    }
    if (type === 'MultiPolygon') {
        const polys = coordinates.map(poly =>
            `(${poly.map(ring => `(${coordsToWkt(ring)})`).join(', ')})`
        ).join(', ')
        return `MULTIPOLYGON (${polys})`
    }
    return null
}

// ── WKT → GeoJSON converters ──────────────────────────────────────
function parseWktCoords(str) {
    return str.trim().split(',').map(pair => {
        const [x, y] = pair.trim().split(/\s+/).map(Number)
        return [x, y]
    })
}

function wktToGeojson(wkt) {
    if (!wkt) return null
    const trimmed = wkt.trim()

    if (trimmed.startsWith('POINT')) {
        const inner = trimmed.match(/POINT\s*\(([^)]+)\)/i)
        if (!inner) return null
        const [x, y] = inner[1].trim().split(/\s+/).map(Number)
        return { type: 'Point', coordinates: [x, y] }
    }

    if (trimmed.startsWith('MULTIPOLYGON')) {
        const inner = trimmed.replace(/^MULTIPOLYGON\s*\(/i, '').replace(/\)$/,'')
        // Simple parse: split polygons
        const polyMatches = [...inner.matchAll(/\(\(([^)]+(?:\)(?!,\s*\())?[^)]*)\)\)/g)]
        const coordinates = polyMatches.map(m => {
            const ringStr = m[1]
            const rings = ringStr.split('),(').map(r => parseWktCoords(r.replace(/[()]/g, '')))
            return rings
        })
        return { type: 'MultiPolygon', coordinates }
    }

    if (trimmed.startsWith('POLYGON')) {
        const inner = trimmed.replace(/^POLYGON\s*\(\(/i, '').replace(/\)\)$/, '')
        const rings = inner.split('),(').map(r => parseWktCoords(r.replace(/[()]/g, '')))
        return { type: 'Polygon', coordinates: rings }
    }

    return null
}

// ── Calculate polygon area (shoelace formula) ─────────────────────
function calcArea(coordinates) {
    if (!coordinates || !coordinates[0]) return 0
    const ring = coordinates[0]
    let area = 0
    for (let i = 0; i < ring.length - 1; i++) {
        area += ring[i][0] * ring[i + 1][1]
        area -= ring[i + 1][0] * ring[i][1]
    }
    return Math.abs(area / 2)
}

// ── Calculate Centroid for Mapbox markers ──────────────────────
function getCentroid(geojson) {
    if (!geojson || !geojson.coordinates || !geojson.coordinates.length) return [0, 0]
    if (geojson.type === 'Point') return geojson.coordinates
    
    let ring;
    if (geojson.type === 'Polygon') {
        ring = geojson.coordinates[0]
    } else if (geojson.type === 'MultiPolygon') {
        ring = geojson.coordinates[0][0]
    } else {
        return [0, 0]
    }

    let lngSum = 0, latSum = 0;
    ring.forEach(c => { 
        lngSum += c[0]; 
        latSum += c[1]; 
    })
    return [lngSum / ring.length, latSum / ring.length]
}

// ── Geometry type from GeoJSON type ───────────────────────────────
function geojsonTypeToGeometryType(type) {
    if (type === 'Point') return 'POINT'
    if (type === 'Polygon') return 'POLYGON'
    if (type === 'MultiPolygon') return 'MULTIPOLYGON'
    return 'POLYGON'
}

// ── Color palette for space types ─────────────────────────────────
const SPACE_COLORS = {
    ROOM: '#3B82F6', // Blue
    OFFICE: '#8B5CF6', // Purple
    CONFERENCE: '#F59E0B', // Amber
    LOBBY: '#10B981', // Emerald
    HALLWAY: '#6B7280', // Gray
    STAIRCASE: '#F97316', // Orange
    ELEVATOR: '#EF4444', // Red
    OPEN_AREA: '#84CC16', // Lime
    UTILITY: '#78716C', // Stone
    STORAGE: '#A16207', // Yellow-Brown
    BATHROOM: '#06B6D4', // Cyan
    KITCHEN: '#EC4899', // Pink
    LAB: '#14B8A6', // Teal
    CAFETERIA: '#F43F5E', // Rose
    PARKING: '#64748B', // Slate
    SERVER_ROOM: '#7C3AED', // Violet
    OTHER: '#9CA3AF', // Light Gray
}

function getSpaceColor(type) {
    return SPACE_COLORS[type] || '#6366F1'
}

function FloorPlanCanvasInner() {
    const { floorId } = useParams()
    const navigate = useNavigate()
    const { isAdmin, isEngineer } = useAuth()
    const canEdit = isAdmin() || isEngineer()

    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)
    const drawRef = useRef(null)

    const [floor, setFloor] = useState(null)
    const [spaces, setSpaces] = useState([])
    const [equipment, setEquipment] = useState([])
    const [selectedSpace, setSelectedSpace] = useState(null)
    const [activeTool, setActiveTool] = useState(null) // 'polygon', 'rectangle', 'point', null
    const [drawnFeature, setDrawnFeature] = useState(null)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [imageUrl, setImageUrl] = useState(null)
    const [drawError, setDrawError] = useState(false)
    const [activeSpace, setActiveSpace] = useState(null)
    const [mapReady, setMapReady] = useState(false)

    // Helper to group spaces by type
    const groupedSpaces = spaces.reduce((acc, s) => {
        const t = s.type || 'UNKNOWN';
        if (!acc[t]) acc[t] = [];
        acc[t].push(s);
        return acc;
    }, {});

    // Inline form state
    const [showNewSpaceForm, setShowNewSpaceForm] = useState(false)
    const [newSpaceName, setNewSpaceName] = useState('')
    const [newSpaceType, setNewSpaceType] = useState('OFFICE')

    // Legend state
    const [highlightedSpaceId, setHighlightedSpaceId] = useState(null)
    const [clickedSpaceIds, setClickedSpaceIds] = useState([])
    // RF Scan state
    const [activeOverlays, setActiveOverlays] = useState(new Set())
    const rfOverlayUrls = useRef(new Map())
    const [mapBounds, setMapBounds] = useState(null)
    
    // Equipment Markers Ref
    const equipmentMarkersRef = useRef([])

    // Load floor data + spaces
    useEffect(() => {
        const loadData = async () => {
            try {
                const [floorRes, spacesRes, eqRes] = await Promise.all([
                    api.get(`/floors/${floorId}`),
                    api.get(`/spaces/floor/${floorId}/geometry`),
                    api.get(`/equipment`)
                ])
                const floorData = floorRes.data.data

                try {
                    const buildingRes = await api.get(`/buildings/${floorData.buildingId}`)
                    floorData.propertyId = buildingRes.data.data.propertyId
                } catch (err) {
                    console.error("Failed to fetch building data for propertyId", err)
                }

                setFloor(floorData)
                setSpaces(spacesRes.data.data || [])
                setEquipment(eqRes.data || [])

                // Load floor plan image
                if (floorRes.data.data.planFileId) {
                    const imgRes = await api.get(
                        `/files/floor-plan/${floorRes.data.data.planFileId}/download`,
                        { responseType: 'blob' }
                    )
                    const contentType = imgRes.headers['content-type'] || 'image/png'
                    const url = URL.createObjectURL(new Blob([imgRes.data], { type: contentType }))
                    setImageUrl(url)
                }
            } catch (err) {
                toast.error('Failed to load floor data or image')
                console.error("FloorPlanCanvas.jsx fetch error:", err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [floorId])

    // Initialize map after image loads
    useEffect(() => {
        if (!imageUrl || mapRef.current) return

        let mapInstance = null

        const img = new Image()
        img.onerror = (err) => {
            console.error("Failed to decode Image object from Blob URL:", imageUrl)
            toast.error("The floor plan image could not be loaded or decoded by the browser.")
        }
        img.onload = () => {
            if (!mapContainerRef.current) return

            // Calculate aspect ratio to prevent squishing
            const aspect = img.width / img.height
            
            // Constrain dimensions to max 80 so we never exceed WebMercator latitude limits (~85 deg)
            let mapWidth = 80
            let mapHeight = 80 / aspect
            
            if (mapHeight > 80) {
                mapHeight = 80
                mapWidth = 80 * aspect
            }

            const bounds = [
                [0, mapHeight],   // top-left
                [mapWidth, mapHeight], // top-right
                [mapWidth, 0],   // bottom-right
                [0, 0]       // bottom-left
            ]
            setMapBounds(bounds)

            mapInstance = new maplibregl.Map({
                container: mapContainerRef.current,
                style: {
                    version: 8,
                    sources: {
                        'floor-plan': {
                            type: 'image',
                            url: imageUrl,
                            coordinates: bounds
                        }
                    },
                    layers: [
                        {
                            id: 'floor-plan-layer',
                            type: 'raster',
                            source: 'floor-plan',
                            paint: { 'raster-opacity': 1 }
                        }
                    ]
                },
                center: [mapWidth / 2, mapHeight / 2],
                zoom: 2,
                minZoom: 0,
                maxZoom: 6,
                renderWorldCopies: false,
                attributionControl: false // Hide MapLibre logo and 'i' icon
            })

            mapInstance.on('load', () => {
                mapRef.current = mapInstance
                setMapReady(true)

                try {
                const draw = new MapboxDraw({
                    displayControlsDefault: false,
                    controls: {},
                    defaultMode: 'simple_select',
                    styles: [
                        {
                            id: 'gl-draw-polygon-fill',
                            type: 'fill',
                            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                            paint: { 'fill-color': '#4F46E5', 'fill-outline-color': '#4F46E5', 'fill-opacity': 0.15 }
                        },
                        {
                            id: 'gl-draw-polygon-stroke-active',
                            type: 'line',
                            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                            paint: { 'line-color': '#4F46E5', 'line-width': 2 }
                        },
                        {
                            id: 'gl-draw-line',
                            type: 'line',
                            filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
                            paint: { 'line-color': '#4F46E5', 'line-width': 2 }
                        },
                        {
                            id: 'gl-draw-point',
                            type: 'circle',
                            filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
                            paint: { 'circle-radius': 5, 'circle-color': '#fff', 'circle-stroke-color': '#4F46E5', 'circle-stroke-width': 2 }
                        },
                        {
                            id: 'gl-draw-point-mid',
                            type: 'circle',
                            filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
                            paint: { 'circle-radius': 3, 'circle-color': '#4F46E5' }
                        },
                        {
                            id: 'gl-draw-point-standalone',
                            type: 'circle',
                            filter: ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'vertex'], ['!=', 'meta', 'midpoint']],
                        }
                    ]
                })
                mapInstance.addControl(draw, 'top-right')

                mapInstance.on('draw.create', (e) => {
                    const feature = e.features[0]
                    setDrawnFeature(feature)
                    setActiveTool(null)
                })

                mapInstance.on('draw.update', (e) => {
                    const feature = e.features[0]
                    setDrawnFeature(feature)
                })

                drawRef.current = draw
            } catch (err) {
                console.error('Failed to initialize drawing tools:', err)
                setDrawError(true)
                toast.error('Drawing tools failed to load. The floor plan is still viewable.')
            }
        })
        }
        img.src = imageUrl

        // Cleanup
        return () => {
            if (mapInstance) mapInstance.remove()
            else if (mapRef.current) mapRef.current.remove()
            mapRef.current = null
            drawRef.current = null
        }
    }, [imageUrl])

    // Load existing geometries onto map when spaces data changes
    useEffect(() => {
        const map = mapRef.current
        if (!map || !map.isStyleLoaded()) return

        // Remove existing space layers
        const existingLayers = map.getStyle().layers || []
        existingLayers.forEach(layer => {
            if (layer.id.startsWith('space-')) map.removeLayer(layer.id)
        })
        const existingSources = Object.keys(map.getStyle().sources || {})
        existingSources.forEach(src => {
            if (src.startsWith('space-')) map.removeSource(src)
        })

        // Add each space with geometry
        spaces.forEach(space => {
            if (!space.geometryWkt) return
            const geojson = wktToGeojson(space.geometryWkt)
            if (!geojson) return

            const sourceId = `space-${space.id}`
            const color = getSpaceColor(space.type)

            try {
                map.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {
                            id: space.id,
                            name: space.name,
                            type: space.type,
                            areaSqM: space.areaSqM
                        },
                        geometry: geojson
                    }
                })

                if (geojson.type === 'Point') {
                    map.addLayer({
                        id: `${sourceId}-circle`,
                        type: 'circle',
                        source: sourceId,
                        paint: {
                            'circle-radius': 10,
                            'circle-color': color,
                            'circle-opacity': 0.8,
                            'circle-stroke-color': '#fff',
                            'circle-stroke-width': 2
                        }
                    })
                } else {
                    map.addLayer({
                        id: `${sourceId}-fill`,
                        type: 'fill',
                        source: sourceId,
                        paint: {
                            'fill-color': color,
                            'fill-opacity': 0.25
                        }
                    })
                    map.addLayer({
                        id: `${sourceId}-stroke`,
                        type: 'line',
                        source: sourceId,
                        paint: {
                            'line-color': color,
                            'line-width': 2.5
                        }
                    })
                    map.addLayer({
                        id: `${sourceId}-label`,
                        type: 'symbol',
                        source: sourceId,
                        layout: {
                            'text-field': space.name,
                            'text-size': 12,
                            'text-font': ['Open Sans Regular'],
                            'text-allow-overlap': true
                        },
                        paint: {
                            'text-color': color,
                            'text-halo-color': '#fff',
                            'text-halo-width': 1.5
                        }
                    })
                }
            } catch (err) {
                console.error(`Failed to add geometry to map for space ${space.id}:`, err)
            }
        })

        // Apply any active highlighting immediately
        const hasActiveHighlighting = highlightedSpaceId !== null || clickedSpaceIds.length > 0;

        spaces.filter(s => s.geometryWkt).forEach(space => {
            const sourceId = `space-${space.id}`
            const isHovered = highlightedSpaceId === space.id;
            const isClicked = clickedSpaceIds.includes(space.id);
            const isCurrentlyHighlighted = isHovered || isClicked;
            
            const opacityMultiplier = (!hasActiveHighlighting || isCurrentlyHighlighted) ? 1 : 0.15;
            
            try {
                if (map.getLayer(`${sourceId}-fill`)) {
                    map.setPaintProperty(`${sourceId}-fill`, 'fill-opacity', 0.25 * opacityMultiplier)
                    map.setPaintProperty(`${sourceId}-stroke`, 'line-opacity', 1 * opacityMultiplier)
                    map.setPaintProperty(`${sourceId}-label`, 'text-opacity', 1 * opacityMultiplier)
                }
                if (map.getLayer(`${sourceId}-circle`)) {
                    map.setPaintProperty(`${sourceId}-circle`, 'circle-opacity', 0.8 * opacityMultiplier)
                }
            } catch (err) {}
        })

        // Add click handler popup for spaces
        const handleClick = (e) => {
            // Check if click hits any space layer
            const spaceLayerIds = spaces
                .filter(s => s.geometryWkt)
                .flatMap(s => [`space-${s.id}-fill`, `space-${s.id}-circle`])
                .filter(id => {
                    try { return map.getLayer(id) } catch { return false }
                })
            if (spaceLayerIds.length === 0) return

            const features = map.queryRenderedFeatures(e.point, { layers: spaceLayerIds })
            if (features.length === 0) return

            const props = features[0].properties
            const spaceData = spaces.find(s => s.id === props.id)
            if (spaceData) {
                setActiveSpace(spaceData)
                setClickedSpaceIds(prev => prev.includes(spaceData.id) ? prev.filter(id => id !== spaceData.id) : [...prev, spaceData.id])
            }
        }
        map.on('click', handleClick)

        // Add mouseenter/mouseleave for highlighting
        const spaceFillLayerIds = spaces.filter(s => s.geometryWkt && wktToGeojson(s.geometryWkt)?.type !== 'Point').map(s => `space-${s.id}-fill`)
        const spaceCircleLayerIds = spaces.filter(s => s.geometryWkt && wktToGeojson(s.geometryWkt)?.type === 'Point').map(s => `space-${s.id}-circle`)

        if (spaceFillLayerIds.length > 0) {
            map.on('mouseenter', spaceFillLayerIds, (e) => {
                map.getCanvas().style.cursor = 'pointer'
                if (e.features && e.features[0]) {
                    setHighlightedSpaceId(e.features[0].properties.id)
                }
            })
            map.on('mouseleave', spaceFillLayerIds, () => {
                map.getCanvas().style.cursor = ''
                setHighlightedSpaceId(null)
            })
        }

        if (spaceCircleLayerIds.length > 0) {
            map.on('mouseenter', spaceCircleLayerIds, (e) => {
                map.getCanvas().style.cursor = 'pointer'
                if (e.features && e.features[0]) {
                    setHighlightedSpaceId(e.features[0].properties.id)
                }
            })
            map.on('mouseleave', spaceCircleLayerIds, () => {
                map.getCanvas().style.cursor = ''
                setHighlightedSpaceId(null)
            })
        }

        return () => {
            map.off('click', handleClick)
            if (spaceFillLayerIds.length > 0) {
                map.off('mouseenter', spaceFillLayerIds)
                map.off('mouseleave', spaceFillLayerIds)
            }
            if (spaceCircleLayerIds.length > 0) {
                map.off('mouseenter', spaceCircleLayerIds)
                map.off('mouseleave', spaceCircleLayerIds)
            }
        }
    }, [spaces, highlightedSpaceId, clickedSpaceIds])

    // Load and render Equipment markers
    useEffect(() => {
        const map = mapRef.current
        if (!map || !mapReady) return

        // Clean up old markers
        equipmentMarkersRef.current.forEach(m => m.remove())
        equipmentMarkersRef.current = []

        const validSpaces = spaces.filter(s => s.geometryWkt)
        const spaceMap = new Map(validSpaces.map(s => [s.id, s]))
        
        const spaceEqCounts = {}

        equipment.forEach(eq => {
            const space = spaceMap.get(eq.spaceId)
            if (!space) return

            const geojson = wktToGeojson(space.geometryWkt)
            const centroid = getCentroid(geojson)
            
            if (!spaceEqCounts[eq.spaceId]) spaceEqCounts[eq.spaceId] = 0
            const offsetMultiplier = spaceEqCounts[eq.spaceId]
            spaceEqCounts[eq.spaceId]++
            
            // tiny offset
            const offsetLng = centroid[0] + (offsetMultiplier * 0.3)
            const offsetLat = centroid[1] - (offsetMultiplier * 0.3)

            const iconHtml = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>`
            
            const el = document.createElement('div')
            el.className = 'equipment-marker popup-trigger'
            el.style.width = '26px'
            el.style.height = '26px'
            el.style.backgroundColor = 'var(--color-primary)'
            el.style.color = 'white'
            el.style.borderRadius = '50%'
            el.style.display = 'flex'
            el.style.alignItems = 'center'
            el.style.justifyContent = 'center'
            el.style.border = '2px solid white'
            el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)'
            el.style.cursor = 'pointer'
            el.style.zIndex = '100'
            el.innerHTML = iconHtml

            const deleteBtnHtml = isAdmin() ? `<button id="btn-del-eq-${eq.id}" style="background:#EF4444;color:white;border:none;padding:6px;border-radius:6px;cursor:pointer;width:100%;font-size:11px;font-weight:600;margin-top:10px;display:flex;justify-content:center;align-items:center;gap:4px">Delete Equipment</button>` : ''

            const popupHTML = `
                <div style="padding:6px;min-width:140px;text-align:center">
                    <div style="font-weight:800;font-size:12px;margin-bottom:6px;color:#1E293B;text-transform:uppercase;letter-spacing:0.05em">${eq.type}</div>
                    <div style="font-size:12px;color:#475569;margin-bottom:2px">${eq.vendor} ${eq.model || ''}</div>
                    <div style="font-size:10px;color:#94A3B8;margin-bottom:4px">${eq.serialNumber || 'No SN'}</div>
                    <div style="font-size:10px;background:var(--color-bg);padding:2px 6px;border-radius:4px;display:inline-block;color:#64748B;font-weight:600">${space.name}</div>
                    ${deleteBtnHtml}
                </div>
            `

            const popup = new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '200px' }).setHTML(popupHTML)

            popup.on('open', () => {
                const btn = document.getElementById(`btn-del-eq-${eq.id}`)
                if (btn) {
                    btn.onclick = async () => {
                        if (window.confirm('Are you sure you want to delete this equipment?')) {
                            try {
                                await api.delete(`/equipment/${eq.id}`)
                                toast.success('Equipment deleted')
                                setEquipment(prev => prev.filter(e => e.id !== eq.id))
                                popup.remove()
                            } catch (err) {
                                toast.error('Failed to delete equipment')
                            }
                        }
                    }
                }
            })

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([offsetLng, offsetLat])
                .setPopup(popup)
                .addTo(map)

            equipmentMarkersRef.current.push(marker)
        })
        
    }, [equipment, spaces, isAdmin, mapReady])
    // Clean up blob URLs
    useEffect(() => {
        return () => {
            rfOverlayUrls.current.forEach(url => URL.revokeObjectURL(url))
        }
    }, [])

    // RF Heatmap functions
    const toggleRfOverlay = async (rfScanId) => {
        const map = mapRef.current
        if (!map || !mapBounds) return

        const sourceId = `rf-overlay-${rfScanId}`
        
        if (activeOverlays.has(rfScanId)) {
            if (map.getLayer(sourceId)) map.removeLayer(sourceId)
            if (map.getSource(sourceId)) map.removeSource(sourceId)
            
            setActiveOverlays(prev => {
                const updated = new Set(prev)
                updated.delete(rfScanId)
                return updated
            })
            return
        }

        try {
            let blobUrl = rfOverlayUrls.current.get(rfScanId)
            if (!blobUrl) {
                const res = await api.get(`/rf-scans/${rfScanId}/heatmap`, { responseType: 'blob' })
                blobUrl = URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] || 'image/png' }))
                rfOverlayUrls.current.set(rfScanId, blobUrl)
            }

            map.addSource(sourceId, {
                type: 'image',
                url: blobUrl,
                coordinates: mapBounds
            })
            
            map.addLayer({
                id: sourceId,
                type: 'raster',
                source: sourceId,
                paint: { 'raster-opacity': 0.65 }
            })

            setActiveOverlays(prev => new Set(prev).add(rfScanId))
        } catch (err) {
            toast.error('Failed to load RF heatmap overlay')
        }
    }

    // ── Drawing tool handlers ─────────────────────────────────────
    const startDraw = useCallback((mode) => {
        const draw = drawRef.current
        if (!draw) return

        // Clear previous drawn feature
        draw.deleteAll()
        setDrawnFeature(null)

        if (mode === 'polygon') {
            draw.changeMode('draw_polygon')
            setActiveTool('polygon')
        } else if (mode === 'rectangle') {
            // MapboxDraw doesn't have a native rectangle mode, use polygon
            draw.changeMode('draw_polygon')
            setActiveTool('rectangle')
        } else if (mode === 'point') {
            draw.changeMode('draw_point')
            setActiveTool('point')
        }
    }, [])

    const cancelDraw = useCallback(() => {
        const draw = drawRef.current
        if (!draw) return
        draw.deleteAll()
        draw.changeMode('simple_select')
        setDrawnFeature(null)
        setActiveTool(null)
        setSelectedSpace(null)
    }, [])

    // ── Save geometry to API ──────────────────────────────────────
    const handleSaveGeometry = async () => {
        if (!drawnFeature || !selectedSpace) {
            toast.error('Draw a shape and select a space first')
            return
        }

        const geometry = drawnFeature.geometry
        const wkt = geojsonToWkt(geometry)
        if (!wkt) {
            toast.error('Failed to convert geometry to WKT')
            return
        }

        const geometryType = geojsonTypeToGeometryType(geometry.type)
        const areaSqM = geometry.type === 'Polygon' ? Math.round(calcArea(geometry.coordinates) * 100) / 100 : null

        setSaving(true)
        try {
            await api.put(`/spaces/${selectedSpace}/geometry`, {
                geometryType,
                geometryWkt: wkt,
                areaSqM
            })
            toast.success('Geometry saved!')

            // Refresh spaces data
            const res = await api.get(`/spaces/floor/${floorId}/geometry`)
            setSpaces(res.data.data || [])

            // Clear draw state
            cancelDraw()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save geometry')
        } finally {
            setSaving(false)
        }
    }

    const handleCreateSpace = async () => {
        if (!newSpaceName.trim()) {
            toast.error('Space name is required')
            return
        }
        
        // Calculate area based on drawn feature
        let areaSqM = null
        if (drawnFeature && drawnFeature.geometry.type === 'Polygon') {
            areaSqM = Math.round(calcArea(drawnFeature.geometry.coordinates) * 100) / 100
        }

        setSaving(true)
        try {
            const res = await api.post('/spaces', {
                floorId: Number(floorId),
                name: newSpaceName.trim(),
                type: newSpaceType,
                areaSqM: areaSqM,
                capacity: null // Optional
            })
            
            toast.success('Space created!')
            const newSpace = res.data.data
            
            // Add to local state & select it automatically
            setSpaces(prev => [...prev, newSpace])
            setSelectedSpace(newSpace.id)
            
            // Reset and close form (keep drawnFeature active so user can click 'Save')
            setShowNewSpaceForm(false)
            setNewSpaceName('')
            setNewSpaceType('OFFICE')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create space')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spin" style={{ width: 40, height: 40, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', margin: '0 auto 16px' }}></div>
                    <p style={{ color: 'var(--color-text-muted)' }}>Loading canvas...</p>
                </div>
            </div>
        )
    }

    if (!floor) {
        return (
            <div style={{ padding: 24 }}>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
                <div className="glass-card" style={{ padding: 48, textAlign: 'center', marginTop: 16 }}>
                    <p style={{ fontWeight: 600 }}>Floor not found</p>
                </div>
            </div>
        )
    }

    if (!imageUrl) {
        return (
            <div style={{ padding: 24 }}>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
                <div className="glass-card" style={{ padding: 48, textAlign: 'center', marginTop: 16 }}>
                    <Layers size={48} color="var(--color-text-muted)" style={{ marginBottom: 16 }} />
                    <p style={{ fontWeight: 600 }}>No floor plan uploaded</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 8 }}>Upload a floor plan first to use the canvas</p>
                </div>
            </div>
        )
    }

    const spacesWithoutGeometry = spaces.filter(s => !s.geometryWkt)
    const canDraw = canEdit && !drawError

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
            {/* Top bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)', zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{floor.levelLabel || 'Floor'} — Canvas</h2>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                            {spaces.length} spaces • {spaces.filter(s => s.geometryWkt).length} labeled
                        </p>
                    </div>
                </div>

                {/* Drawing tools */}
                {drawError && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 14px', background: '#FEF3C7',
                        borderRadius: 8, fontSize: 12, color: '#92400E'
                    }}>
                        <AlertTriangle size={14} />
                        Drawing tools unavailable — view only
                    </div>
                )}

                {canDraw && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            display: 'flex', gap: 4, padding: '4px',
                            background: 'var(--color-bg)', borderRadius: 12
                        }}>
                            <button
                                className={`btn ${activeTool === null && !drawnFeature ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '6px 10px', fontSize: 12 }}
                                onClick={cancelDraw}
                                title="Select mode"
                            >
                                <MousePointer size={14} />
                            </button>
                            <button
                                className={`btn ${activeTool === 'polygon' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '6px 10px', fontSize: 12 }}
                                onClick={() => startDraw('polygon')}
                                title="Draw polygon"
                            >
                                <Pentagon size={14} />
                            </button>
                            <button
                                className={`btn ${activeTool === 'rectangle' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '6px 10px', fontSize: 12 }}
                                onClick={() => startDraw('rectangle')}
                                title="Draw rectangle"
                            >
                                <Square size={14} />
                            </button>
                            <button
                                className={`btn ${activeTool === 'point' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '6px 10px', fontSize: 12 }}
                                onClick={() => startDraw('point')}
                                title="Place point"
                            >
                                <MapPin size={14} />
                            </button>
                        </div>

                        {drawnFeature && !showNewSpaceForm && (
                            <>
                                <div style={{ width: 1, height: 28, background: 'var(--color-border)' }}></div>
                                <select
                                    className="input-field"
                                    style={{ width: 200, padding: '6px 10px', fontSize: 12, borderRadius: 8 }}
                                    value={selectedSpace || ''}
                                    onChange={e => setSelectedSpace(e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">Assign to space...</option>
                                    {spacesWithoutGeometry.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                                    ))}
                                    {/* Also allow reassigning spaces that already have geometry */}
                                    {spaces.filter(s => s.geometryWkt).map(s => (
                                        <option key={s.id} value={s.id}>↻ {s.name} ({s.type})</option>
                                    ))}
                                </select>
                                
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '6px 10px', fontSize: 12 }}
                                    onClick={() => setShowNewSpaceForm(true)}
                                    title="Create New Space"
                                >
                                    <Plus size={14} /> Create Space
                                </button>

                                <button
                                    className="btn btn-primary"
                                    style={{ padding: '6px 14px', fontSize: 12 }}
                                    onClick={handleSaveGeometry}
                                    disabled={saving || !selectedSpace}
                                >
                                    <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    className="btn btn-danger"
                                    style={{ padding: '6px 10px', fontSize: 12 }}
                                    onClick={cancelDraw}
                                    title="Cancel drawing"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </>
                        )}

                        {drawnFeature && showNewSpaceForm && (
                            <>
                                <div style={{ width: 1, height: 28, background: 'var(--color-border)' }}></div>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Space Name"
                                    style={{ width: 150, padding: '6px 10px', fontSize: 12, borderRadius: 8 }}
                                    value={newSpaceName}
                                    onChange={e => setNewSpaceName(e.target.value)}
                                    autoFocus
                                />
                                <select
                                    className="input-field"
                                    style={{ width: 130, padding: '6px 10px', fontSize: 12, borderRadius: 8 }}
                                    value={newSpaceType}
                                    onChange={e => setNewSpaceType(e.target.value)}
                                >
                                    {[
                                        'ROOM', 'OFFICE', 'CONFERENCE', 'LOBBY', 'HALLWAY', 'STAIRCASE',
                                        'ELEVATOR', 'OPEN_AREA', 'UTILITY', 'STORAGE', 'BATHROOM',
                                        'KITCHEN', 'LAB', 'CAFETERIA', 'PARKING', 'SERVER_ROOM', 'OTHER'
                                    ].map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                
                                <button
                                    className="btn btn-primary"
                                    style={{ padding: '6px 14px', fontSize: 12 }}
                                    onClick={handleCreateSpace}
                                    disabled={saving}
                                >
                                    {saving ? 'Creating...' : 'Create'}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '6px 10px', fontSize: 12 }}
                                    onClick={() => setShowNewSpaceForm(false)}
                                    title="Cancel Space Creation"
                                >
                                    <X size={14} />
                                </button>
                            </>
                        )}
                    </div>
                )}  
            </div>

            {/* Main view area */}
            <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

                    {/* RF Heatmap Legend (Top Right) */}
                    {activeOverlays.size > 0 && (
                        <div style={{
                            position: 'absolute', top: 16, right: 16, zIndex: 10,
                            background: '#0B0F19', color: '#E2E8F0', padding: '12px 16px',
                            borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            fontSize: 12, width: 220, pointerEvents: 'auto'
                        }}>
                            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: '#FFF' }}>
                                RF Signal Strength
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 14, height: 14, background: 'linear-gradient(to right, #FFA500, #FF0000)', borderRadius: 2 }}></div>
                                    <span>-30 ~ -45 dBm <span style={{ color: '#FF4444' }}>Strong</span></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 14, height: 14, background: 'linear-gradient(to right, #FFFF00, #FFA500)', borderRadius: 2 }}></div>
                                    <span>-45 ~ -60 dBm <span style={{ color: '#FFA500' }}>Good</span></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 14, height: 14, background: 'linear-gradient(to right, #00FF00, #FFFF00)', borderRadius: 2 }}></div>
                                    <span>-60 ~ -70 dBm <span style={{ color: '#4ADE80' }}>Fair</span></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 14, height: 14, background: 'linear-gradient(to right, #00FFFF, #00FF00)', borderRadius: 2 }}></div>
                                    <span>-70 ~ -80 dBm <span style={{ color: '#2DD4BF' }}>Weak</span></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 14, height: 14, background: 'linear-gradient(to right, #0000FF, #00FFFF)', borderRadius: 2 }}></div>
                                    <span>-80 ~ -90 dBm <span style={{ color: '#60A5FA' }}>Poor</span></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Left Sidebar for Legends and Controls */}
                    <div style={{
                        position: 'absolute', top: 16, bottom: 16, left: 16, width: 300, zIndex: 10,
                        display: 'flex', flexDirection: 'column', gap: 16, pointerEvents: 'none'
                    }}>
                        {/* RF Scans */}
                        <div style={{ pointerEvents: 'auto', flexShrink: 0, maxHeight: '50%', overflowY: 'auto', borderRadius: 12 }}>
                            <RfHeatmaps 
                                floorId={floorId}
                                propertyId={floor.propertyId}
                                activeOverlays={activeOverlays}
                                onToggleOverlay={toggleRfOverlay}
                            />
                        </div>

                        {/* Legend */}
                        <div style={{
                            background: 'var(--color-surface)', backdropFilter: 'blur(8px)',
                            borderRadius: 12, padding: '12px 16px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                            flexShrink: 1, overflowY: 'auto', fontSize: 12, pointerEvents: 'auto'
                        }}>
                            <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--color-text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Spaces ({spaces.length})</span>
                                {(highlightedSpaceId !== null || clickedSpaceIds.length > 0) && (
                                    <button 
                                        onClick={() => {
                                            setHighlightedSpaceId(null)
                                            setClickedSpaceIds([])
                                            setActiveSpace(null)
                                        }}
                                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 11, cursor: 'pointer', padding: 0 }}
                                        title="Clear all highlights"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            {spaces.length === 0 ? (
                                <p style={{ color: '#94A3B8', fontSize: 11 }}>No spaces created yet</p>
                            ) : (
                                Object.entries(groupedSpaces).map(([type, spacesInType]) => (
                                    <div key={type} style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, borderBottom: '1px solid var(--color-border)', paddingBottom: 4 }}>
                                            <div style={{ width: 12, height: 12, borderRadius: 3, background: getSpaceColor(type) }}></div>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {type} ({spacesInType.length})
                                            </span>
                                        </div>
                                        <div style={{ paddingLeft: 8 }}>
                                            {spacesInType.map(s => {
                                                const hasGeometry = !!s.geometryWkt;
                                                const isHovered = highlightedSpaceId === s.id;
                                                const isClicked = clickedSpaceIds.includes(s.id);
                                                const isHighlighted = isHovered || isClicked || activeSpace?.id === s.id;
                                                const hasActiveHighlighting = highlightedSpaceId !== null || clickedSpaceIds.length > 0 || activeSpace !== null;
                                                const isFaded = hasActiveHighlighting && !isHighlighted;

                                                return (
                                                    <div 
                                                        key={s.id} 
                                                        onMouseEnter={() => hasGeometry && setHighlightedSpaceId(s.id)}
                                                        onMouseLeave={() => hasGeometry && setHighlightedSpaceId(null)}
                                                        onClick={() => {
                                                            if (hasGeometry) {
                                                                setClickedSpaceIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]);
                                                                setActiveSpace(s);
                                                            }
                                                        }}
                                                        title={hasGeometry ? 'Click to highlight and view' : 'No shape drawn yet'}
                                                        style={{ 
                                                            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, 
                                                            cursor: hasGeometry ? 'pointer' : 'default',
                                                            opacity: isFaded ? 0.3 : 1,
                                                            transition: 'opacity 0.2s',
                                                            padding: '4px 6px',
                                                            borderRadius: '6px',
                                                            background: isHighlighted ? 'var(--color-bg)' : 'transparent',
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: 8, height: 8, borderRadius: '50%',
                                                            background: hasGeometry ? getSpaceColor(s.type) : 'transparent',
                                                            border: hasGeometry ? 'none' : `1px dashed ${getSpaceColor(s.type)}`,
                                                            flexShrink: 0
                                                        }}></div>
                                                        <span style={{ 
                                                            color: 'var(--color-text)', 
                                                            fontSize: 11,
                                                            fontWeight: isHighlighted ? 700 : 500,
                                                            fontStyle: hasGeometry ? 'normal' : 'italic',
                                                        }}>
                                                            {s.name} {!hasGeometry && <span style={{ fontSize: 9, opacity: 0.6 }}>(unmapped)</span>}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {activeSpace && (
                    <SpaceDetailsPanel 
                        space={activeSpace} 
                        onClose={() => { 
                            setClickedSpaceIds(prev => prev.filter(id => id !== activeSpace.id));
                            setActiveSpace(null); 
                            setHighlightedSpaceId(null); 
                        }} 
                        onSpaceUpdated={(updated) => setSpaces(spaces.map(s => s.id === updated.id ? updated : s))} 
                    />
                )}
            </div>
        </div>
    )
}

// Wrap export with ErrorBoundary for safety
export default function FloorPlanCanvas() {
    return (
        <ErrorBoundary>
            <FloorPlanCanvasInner />
        </ErrorBoundary>
    )
}
