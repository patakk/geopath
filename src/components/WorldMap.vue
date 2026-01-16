<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

const props = defineProps({
  showLabels: {
    type: Boolean,
    default: true
  },
  projection: {
    type: String,
    default: 'naturalEarth'
  },
  gameActive: {
    type: Boolean,
    default: false
  },
  blindMode: {
    type: Boolean,
    default: false
  },
  startCountry: {
    type: String,
    default: null
  },
  endCountry: {
    type: String,
    default: null
  },
  guessedCountries: {
    type: Set,
    default: () => new Set()
  },
  wrongGuesses: {
    type: Set,
    default: () => new Set()
  },
  normalizeCountryName: {
    type: Function,
    default: (name) => name
  },
  getDisplayName: {
    type: Function,
    default: (code) => code
  },
  isDark: {
    type: Boolean,
    default: false
  },
  highDetail: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['countriesLoaded'])

const mapContainer = ref(null)
let svg = null
let projection = null
let path = null
let countriesGroup = null
let labelsGroup = null
let worldData = null
let worldDataHighDetail = null
let worldDataLowDetail = null
let countriesData = null
let currentZoom = 1
let isDragging = false

const WORLD_ATLAS_URL_HIGH = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'
const WORLD_ATLAS_URL_LOW = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const isMobile = () => window.innerWidth <= 768

const projectionFactories = {
  mercator: (width, height) => d3.geoMercator()
    .scale(isMobile() ? width / 1.6 : width / 6.5)
    .translate([width / 2, height / 2]),
  naturalEarth: (width, height) => d3.geoNaturalEarth1()
    .scale(width / 5.5)
    .translate([width / 2, height / 2]),
  equalEarth: (width, height) => d3.geoEqualEarth()
    .scale(width / 5.5)
    .translate([width / 2, height / 2]),
  equirectangular: (width, height) => d3.geoEquirectangular()
    .scale(width / 6.5)
    .translate([width / 2, height / 2]),
  globe: (width, height) => d3.geoOrthographic()
    .scale(Math.min(width, height) / 2.2)
    .translate([width / 2, height / 2])
    .clipAngle(90),
  stereographic: (width, height) => d3.geoStereographic()
    .scale(width / 10)
    .translate([width / 2, height / 2])
    .clipAngle(140),
  azimuthal: (width, height) => d3.geoAzimuthalEqualArea()
    .scale(width / 5.5)
    .translate([width / 2, height / 2])
    .clipAngle(150),
  gnomonic: (width, height) => d3.geoGnomonic()
    .scale(width / 6)
    .translate([width / 2, height / 2])
    .clipAngle(60),
  conic: (width, height) => d3.geoConicEqualArea()
    .scale(width / 5.5)
    .translate([width / 2, height / 2])
}

function getBaseSize(feature) {
  const area = d3.geoArea(feature)
  if (area > 0.1) return 10
  if (area > 0.02) return 8
  return 6
}

function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function getCountryColor(feature) {
  const name = props.normalizeCountryName(feature.properties.name)

  if (!props.gameActive) {
    return getCSSVar('--country-fill')
  }

  if (props.blindMode) {
    if (name === props.startCountry) return getCSSVar('--game-start-bg')
    if (name === props.endCountry) return getCSSVar('--game-end-bg')
    if (props.guessedCountries.has(name)) return getCSSVar('--game-guessed')
    if (props.wrongGuesses.has(name)) return getCSSVar('--game-wrong')
    return 'transparent'
  }

  if (name === props.startCountry) return getCSSVar('--game-start-bg')
  if (name === props.endCountry) return getCSSVar('--game-end-bg')
  if (props.guessedCountries.has(name)) return getCSSVar('--game-guessed')
  if (props.wrongGuesses.has(name)) return getCSSVar('--game-wrong')
  return getCSSVar('--country-fill')
}

function getCountryStroke(feature) {
  const name = props.normalizeCountryName(feature.properties.name)

  if (props.gameActive && props.blindMode) {
    if (name === props.startCountry || name === props.endCountry || props.guessedCountries.has(name) || props.wrongGuesses.has(name)) {
      return getCSSVar('--border-tertiary')
    }
    return 'transparent'
  }

  return getCSSVar('--country-stroke')
}

function updateLabelSizes() {
  if (!labelsGroup) return

  const sphericalProjections = ['globe', 'stereographic', 'azimuthal', 'gnomonic']
  const isSpherical = sphericalProjections.includes(props.projection)

  labelsGroup.selectAll('.country-label')
    .attr('font-size', d => {
      const baseSize = getBaseSize(d)
      // For spherical projections, don't scale with zoom since labels are repositioned
      // For flat projections, counter the zoom transform to keep constant pixel size
      if (isSpherical) {
        return `${baseSize}px`
      }
      const scaledSize = baseSize / currentZoom
      return `${Math.max(scaledSize, 2)}px`
    })
}

function updateLabelPositions() {
  if (!labelsGroup || !path) return

  // If labels are hidden, just set opacity to 0 and skip expensive calculations
  if (!props.showLabels) {
    labelsGroup.selectAll('.country-label').attr('opacity', 0)
    return
  }

  const sphericalProjections = ['globe', 'stereographic', 'azimuthal', 'gnomonic']
  const isSpherical = sphericalProjections.includes(props.projection)

  labelsGroup.selectAll('.country-label')
    .attr('transform', d => {
      const centroid = path.centroid(d)
      if (isNaN(centroid[0]) || isNaN(centroid[1])) {
        return 'translate(-9999, -9999)'
      }
      return `translate(${centroid[0]}, ${centroid[1]})`
    })
    .attr('opacity', d => {
      if (!props.showLabels) return 0

      const name = props.normalizeCountryName(d.properties.name)

      // In blind mode, only show labels for visible countries
      if (props.gameActive && props.blindMode) {
        if (name !== props.startCountry && name !== props.endCountry && !props.guessedCountries.has(name) && !props.wrongGuesses.has(name)) {
          return 0
        }
      }

      if (isSpherical) {
        const centroid = d3.geoCentroid(d)
        const rotation = projection.rotate()
        const distance = d3.geoDistance(centroid, [-rotation[0], -rotation[1]])
        return distance > Math.PI / 2 ? 0 : 1
      }
      return 1
    })
}

function updateCountryStyles() {
  if (!countriesGroup) return

  countriesGroup.selectAll('path')
    .attr('fill', d => getCountryColor(d))
    .attr('stroke', d => getCountryStroke(d))
}

function drawMap() {
  if (!worldData || !svg) return

  const container = mapContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  projection = projectionFactories[props.projection](width, height)
  path = d3.geoPath().projection(projection)

  countriesData = topojson.feature(worldData, worldData.objects.countries)

  // Emit country names for autocomplete
  const countryNames = countriesData.features
    .map(f => props.normalizeCountryName(f.properties.name))
    .filter(Boolean)
  emit('countriesLoaded', countryNames)

  countriesGroup.selectAll('path')
    .data(countriesData.features)
    .join('path')
    .attr('d', path)
    .attr('class', 'country')
    .attr('fill', d => getCountryColor(d))
    .attr('stroke', d => getCountryStroke(d))
    .attr('stroke-width', isMobile() ? 0.4 : 0.75)

  labelsGroup.selectAll('text')
    .data(countriesData.features)
    .join('text')
    .attr('class', 'country-label')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', d => {
      const name = props.normalizeCountryName(d.properties.name)
      if (props.gameActive) {
        if (name === props.startCountry) return getCSSVar('--accent-green')
        if (name === props.endCountry) return getCSSVar('--accent-red')
        if (props.guessedCountries.has(name)) return getCSSVar('--accent-blue')
        if (props.wrongGuesses.has(name)) return getCSSVar('--accent-yellow')
      }
      return getCSSVar('--text-muted')
    })
    .attr('font-family', 'Outfit, sans-serif')
    .attr('font-weight', '400')
    .attr('pointer-events', 'none')
    .text(d => {
      const code = props.normalizeCountryName(d.properties.name)
      return code ? props.getDisplayName(code) : ''
    })

  updateLabelPositions()
  updateLabelSizes()
  setupInteraction()
}

function setupInteraction() {
  const container = mapContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  svg.on('.zoom', null)
  svg.on('.drag', null)

  const sphericalProjections = ['globe', 'stereographic', 'azimuthal', 'gnomonic']
  const isSpherical = sphericalProjections.includes(props.projection)

  if (isSpherical) {
    let rotate0, coords0

    const drag = d3.drag()
      .on('start', (event) => {
        rotate0 = projection.rotate()
        coords0 = [event.x, event.y]
        isDragging = true
        // Hide labels during drag for performance
        labelsGroup.style('opacity', 0)
      })
      .on('drag', (event) => {
        const coords1 = [event.x, event.y]
        const sensitivity = 0.25

        const newRotate = [
          rotate0[0] + (coords1[0] - coords0[0]) * sensitivity,
          Math.max(-90, Math.min(90, rotate0[1] - (coords1[1] - coords0[1]) * sensitivity)),
          rotate0[2] || 0
        ]

        projection.rotate(newRotate)
        countriesGroup.selectAll('path').attr('d', path)
        // Don't update labels during drag - too expensive
      })
      .on('end', () => {
        isDragging = false
        // Show labels and update positions after drag ends
        updateLabelPositions()
        labelsGroup.style('opacity', 1)
      })

    svg.call(drag)

    let wheelTimeout = null
    svg.on('wheel', (event) => {
      event.preventDefault()
      const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1
      const currentScale = projection.scale()
      const newScale = currentScale * scaleFactor
      const minScale = Math.min(width, height) / 8
      const maxScale = Math.min(width, height) * 4

      if (newScale >= minScale && newScale <= maxScale) {
        currentZoom = newScale / (Math.min(width, height) / 2.2)
        projection.scale(newScale)
        countriesGroup.selectAll('path').attr('d', path)

        // Debounce label updates during wheel
        labelsGroup.style('opacity', 0)
        clearTimeout(wheelTimeout)
        wheelTimeout = setTimeout(() => {
          updateLabelPositions()
          updateLabelSizes()
          labelsGroup.style('opacity', 1)
        }, 150)
      }
    })
  } else {
    const zoom = d3.zoom()
      .scaleExtent([0.5, 20])
      .on('start', () => {
        // Interrupt any ongoing transitions to allow immediate interaction
        svg.interrupt()
        countriesGroup.interrupt()
        labelsGroup.interrupt()
      })
      .on('zoom', (event) => {
        currentZoom = event.transform.k
        countriesGroup.attr('transform', event.transform)
        labelsGroup.attr('transform', event.transform)
        updateLabelSizes()
        // Keep border thickness constant by scaling inversely with zoom
        const baseStroke = isMobile() ? 0.4 : 0.75
        countriesGroup.selectAll('.country')
          .attr('stroke-width', baseStroke / currentZoom)
      })

    // Also interrupt on touch start for mobile
    svg.on('touchstart.interrupt', () => {
      svg.interrupt()
      countriesGroup.interrupt()
      labelsGroup.interrupt()
    })

    svg.call(zoom)
  }
}

async function initMap() {
  const container = mapContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  d3.select(container).selectAll('*').remove()
  currentZoom = 1

  svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  countriesGroup = svg.append('g').attr('class', 'countries')
  labelsGroup = svg.append('g').attr('class', 'labels')

  // Load and cache both detail levels separately
  if (props.highDetail) {
    if (!worldDataHighDetail) {
      worldDataHighDetail = await d3.json(WORLD_ATLAS_URL_HIGH)
    }
    worldData = worldDataHighDetail
  } else {
    if (!worldDataLowDetail) {
      worldDataLowDetail = await d3.json(WORLD_ATLAS_URL_LOW)
    }
    worldData = worldDataLowDetail
  }

  drawMap()
}

function centerOnCountry(countryName) {
  if (!countriesData || !countryName || !svg) return

  const feature = countriesData.features.find(
    f => props.normalizeCountryName(f.properties.name) === countryName
  )
  if (!feature) return

  const centroid = d3.geoCentroid(feature)
  centerOnCoordinates(centroid)
}

function centerOnMidpoint(country1, country2) {
  if (!countriesData || !country1 || !country2 || !svg) return

  const feature1 = countriesData.features.find(
    f => props.normalizeCountryName(f.properties.name) === country1
  )
  const feature2 = countriesData.features.find(
    f => props.normalizeCountryName(f.properties.name) === country2
  )
  if (!feature1 || !feature2) return

  const centroid1 = d3.geoCentroid(feature1)
  const centroid2 = d3.geoCentroid(feature2)

  // Calculate midpoint (simple average for geographic coordinates)
  const midpoint = [
    (centroid1[0] + centroid2[0]) / 2,
    (centroid1[1] + centroid2[1]) / 2
  ]

  centerOnCoordinates(midpoint)
}

function centerOnCoordinates(coords) {
  if (!svg) return

  const container = mapContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  const sphericalProjections = ['globe', 'stereographic', 'azimuthal', 'gnomonic']
  const isSpherical = sphericalProjections.includes(props.projection)

  if (isSpherical) {
    // Rotate projection to center on coordinates
    projection.rotate([-coords[0], -coords[1]])
    countriesGroup.selectAll('path').attr('d', path)
    updateLabelPositions()
  } else {
    // Pan flat map to center on coordinates
    const [x, y] = projection(coords)
    const transform = d3.zoomIdentity
      .translate(width / 2 - x, height / 2 - y)

    svg.transition()
      .duration(500)
      .call(d3.zoom().transform, transform)

    currentZoom = 1
    countriesGroup.attr('transform', transform)
    labelsGroup.attr('transform', transform)
    updateLabelSizes()
    // Reset stroke width to match zoom level
    const baseStroke = isMobile() ? 0.4 : 0.75
    countriesGroup.selectAll('.country')
      .attr('stroke-width', baseStroke / currentZoom)
  }
}

watch(() => props.showLabels, () => {
  updateLabelPositions()
})

// Center on midpoint between start and end countries when game begins
watch([() => props.startCountry, () => props.endCountry], ([newStart, newEnd], [oldStart, oldEnd]) => {
  if (newStart && newEnd && props.gameActive && (newStart !== oldStart || newEnd !== oldEnd)) {
    // Small delay to ensure map is ready
    setTimeout(() => centerOnMidpoint(newStart, newEnd), 100)
  }
})

watch(() => props.projection, () => {
  currentZoom = 1
  if (countriesGroup) countriesGroup.attr('transform', null)
  if (labelsGroup) labelsGroup.attr('transform', null)
  if (svg) svg.call(d3.zoom().transform, d3.zoomIdentity)
  drawMap()
})

watch(() => props.highDetail, () => {
  initMap()
})

function updateLabelColors() {
  if (!labelsGroup) return
  labelsGroup.selectAll('.country-label')
    .attr('fill', d => {
      const name = props.normalizeCountryName(d.properties.name)
      if (props.gameActive) {
        if (name === props.startCountry) return getCSSVar('--accent-green')
        if (name === props.endCountry) return getCSSVar('--accent-red')
        if (props.guessedCountries.has(name)) return getCSSVar('--accent-blue')
        if (props.wrongGuesses.has(name)) return getCSSVar('--accent-yellow')
      }
      return getCSSVar('--text-muted')
    })
}

watch(() => props.isDark, () => {
  updateCountryStyles()
  updateLabelColors()
})

watch([() => props.gameActive, () => props.blindMode, () => props.startCountry, () => props.endCountry, () => props.guessedCountries, () => props.wrongGuesses], () => {
  updateCountryStyles()
  updateLabelPositions()
  updateLabelColors()
}, { deep: true })

function handleResize() {
  initMap()
}

onMounted(() => {
  initMap()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div ref="mapContainer" class="map-container" :class="{ 'game-mode': gameActive }"></div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  background-color: var(--map-bg);
  cursor: grab;
}

.map-container:active {
  cursor: grabbing;
}

.map-container :deep(.country) {
}

.map-container:not(.game-mode) :deep(.country:hover) {
  fill: var(--country-hover);
}

.map-container :deep(.labels) {
  transition: opacity 0.15s ease-out;
}

@media (max-width: 768px) {
  .map-container :deep(.country) {
    stroke-width: 0.4;
  }
}
</style>
