<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import WorldMap from './components/WorldMap.vue'
import { useCountryGame } from './composables/useCountryGame'

const showLabels = ref(true)
const currentProjection = ref('mercator')
const projectionsExpanded = ref(false)
const highDetail = ref(false)

// Theme toggle
const isDark = ref(false)

function initTheme() {
  const saved = localStorage.getItem('theme')
  if (saved) {
    isDark.value = saved === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme()
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

onMounted(() => {
  initTheme()
})

const projections = [
  { id: 'mercator', label: 'Mercator' },
  { id: 'naturalEarth', label: 'Natural Earth' },
  { id: 'equalEarth', label: 'Equal Earth' },
  { id: 'equirectangular', label: 'Equirectangular' },
  { id: 'globe', label: 'Globe' },
  { id: 'stereographic', label: 'Stereographic' },
  { id: 'azimuthal', label: 'Azimuthal' },
  { id: 'gnomonic', label: 'Gnomonic' },
  { id: 'conic', label: 'Conic' }
]

const {
  gameActive,
  blindMode,
  startCountry,
  endCountry,
  shortestPath,
  sortedPaths,
  guessedCountries,
  wrongGuesses,
  countryInput,
  gameWon,
  lastGuessResult,
  allCountryNames,
  foundCount,
  totalToFind,
  normalizeCountryName,
  getDisplayName,
  getAllCountryNames,
  startNewGame,
  makeGuess,
  endGame,
  revealPath
} = useCountryGame()

const inputRef = ref(null)
const selectedSuggestion = ref(-1)
const showSuggestions = ref(false)

const suggestions = computed(() => {
  const input = countryInput.value.trim().toLowerCase()
  if (!input || input.length < 1) return []

  const allNames = getAllCountryNames()
  return allNames
    .filter(name => name.toLowerCase().includes(input))
    .sort((a, b) => {
      // Prioritize names that start with the input
      const aStarts = a.toLowerCase().startsWith(input)
      const bStarts = b.toLowerCase().startsWith(input)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return a.localeCompare(b)
    })
    .slice(0, 8)
})

function handleCountriesLoaded(names) {
  allCountryNames.value = names
}

function selectSuggestion(name) {
  countryInput.value = name
  showSuggestions.value = false
  selectedSuggestion.value = -1
  makeGuess(name)
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

function handleGuessSubmit() {
  if (selectedSuggestion.value >= 0 && suggestions.value[selectedSuggestion.value]) {
    selectSuggestion(suggestions.value[selectedSuggestion.value])
  } else {
    makeGuess(countryInput.value)
  }
  showSuggestions.value = false
  selectedSuggestion.value = -1
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

const pathRevealed = ref(false)

function handleReveal() {
  revealPath()
  showLabels.value = true
  pathRevealed.value = true
}

function handleEndGame() {
  endGame()
  showLabels.value = true
}

function handleStartGame() {
  showLabels.value = false
  pathRevealed.value = false
  startNewGame()
  setTimeout(() => {
    if (inputRef.value) inputRef.value.focus()
  }, 100)
}

function handleKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (suggestions.value.length > 0) {
      showSuggestions.value = true
      selectedSuggestion.value = Math.min(selectedSuggestion.value + 1, suggestions.value.length - 1)
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedSuggestion.value = Math.max(selectedSuggestion.value - 1, -1)
  } else if (e.key === 'Enter') {
    handleGuessSubmit()
  } else if (e.key === 'Escape') {
    showSuggestions.value = false
    selectedSuggestion.value = -1
  }
}

function handleInput() {
  showSuggestions.value = true
  selectedSuggestion.value = -1
}

// Clear last guess result after a delay
watch(lastGuessResult, (val) => {
  if (val) {
    setTimeout(() => {
      lastGuessResult.value = null
    }, 1500)
  }
})

// Show labels when game is won
watch(gameWon, (won) => {
  if (won) {
    showLabels.value = true
  }
})
</script>

<template>
  <div class="app">
    <div class="controls">
      <div class="control-group">
        <button class="projection-header" @click="projectionsExpanded = !projectionsExpanded">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span class="current-projection">{{ projections.find(p => p.id === currentProjection)?.label }}</span>
          <svg class="chevron" :class="{ expanded: projectionsExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
        <div v-if="projectionsExpanded" class="projection-buttons">
          <button
            v-for="proj in projections"
            :key="proj.id"
            :class="['projection-btn', { active: currentProjection === proj.id }]"
            @click="currentProjection = proj.id"
          >
            {{ proj.label }}
          </button>
        </div>
      </div>
      <div class="divider"></div>
      <label class="toggle" :class="{ disabled: gameActive }">
        <input type="checkbox" v-model="showLabels" :disabled="gameActive" />
        <span class="checkbox"></span>
        <span>Show country names</span>
      </label>
      <label class="toggle">
        <input type="checkbox" v-model="highDetail" />
        <span class="checkbox"></span>
        <span>High detail borders</span>
      </label>
      <div class="divider"></div>
      <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
        <svg v-if="isDark" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        <span>{{ isDark ? 'Light mode' : 'Dark mode' }}</span>
      </button>
    </div>

    <!-- Game Panel -->
    <div class="game-panel">
      <template v-if="!gameActive">
        <div class="game-intro">
          <span class="game-title">Country Path</span>
          <span class="game-desc">Name all countries on the shortest path between two places</span>
        </div>
        <button class="game-btn start" @click="handleStartGame">New Game</button>
      </template>

      <template v-else>
        <div class="game-header">
          <div class="countries-display">
            <span class="country start">{{ getDisplayName(startCountry) }}</span>
            <span class="arrow">→</span>
            <span class="country end">{{ getDisplayName(endCountry) }}</span>
          </div>
          <div class="game-stats">
            <span class="stat">{{ foundCount }}/{{ totalToFind }} found</span>
          </div>
        </div>

        <div class="game-controls">
          <label class="toggle small">
            <input type="checkbox" v-model="blindMode" />
            <span class="checkbox"></span>
            <span>Blind mode</span>
          </label>
        </div>

        <div v-if="gameWon || pathRevealed" class="path-result">
          <div v-if="gameWon" class="win-message">You found the path!</div>
          <div v-if="sortedPaths.length > 1" class="paths-header">
            {{ sortedPaths.length }} possible paths:
          </div>
          <div
            v-for="(path, pathIndex) in sortedPaths"
            :key="pathIndex"
            class="path-list"
            :class="{ 'user-path': gameWon && pathIndex === 0 }"
          >
            <span
              v-for="(country, index) in path"
              :key="country"
              class="path-country"
            >
              <span :class="{
                'start': index === 0,
                'end': index === path.length - 1,
                'middle': index > 0 && index < path.length - 1
              }">{{ getDisplayName(country) }}</span>
              <span v-if="index < path.length - 1" class="path-arrow">→</span>
            </span>
          </div>
        </div>

        <div v-else class="guess-section">
          <div class="input-container">
            <div class="input-wrapper">
              <input
                ref="inputRef"
                v-model="countryInput"
                type="text"
                placeholder="Enter country name..."
                class="guess-input"
                @keydown="handleKeydown"
                @input="handleInput"
                @focus="showSuggestions = true"
                @blur="setTimeout(() => showSuggestions = false, 150)"
                autocomplete="off"
                :class="{
                  'error': lastGuessResult === 'wrong' || lastGuessResult === 'invalid',
                  'success': lastGuessResult === 'correct'
                }"
              />
              <button class="guess-btn" @click="handleGuessSubmit">Guess</button>
            </div>
            <div v-if="showSuggestions && suggestions.length > 0" class="suggestions">
              <div
                v-for="(suggestion, index) in suggestions"
                :key="suggestion"
                class="suggestion"
                :class="{ selected: index === selectedSuggestion }"
                @mousedown.prevent="selectSuggestion(suggestion)"
              >
                {{ suggestion }}
              </div>
            </div>
          </div>
          <div class="feedback" v-if="lastGuessResult">
            <span v-if="lastGuessResult === 'correct'" class="correct">Correct!</span>
            <span v-else-if="lastGuessResult === 'wrong'" class="wrong">Not on the path</span>
            <span v-else-if="lastGuessResult === 'already'" class="already">Already guessed</span>
            <span v-else-if="lastGuessResult === 'invalid'" class="invalid">Unknown country</span>
          </div>
        </div>

        <div class="game-actions">
          <button class="game-btn secondary" @click="handleReveal">Reveal</button>
          <button class="game-btn secondary" @click="handleEndGame">End Game</button>
          <button class="game-btn" @click="handleStartGame">New Game</button>
        </div>
      </template>
    </div>

    <WorldMap
      :show-labels="showLabels"
      :projection="currentProjection"
      :game-active="gameActive"
      :blind-mode="blindMode"
      :start-country="startCountry"
      :end-country="endCountry"
      :guessed-countries="guessedCountries"
      :wrong-guesses="wrongGuesses"
      :normalize-country-name="normalizeCountryName"
      :get-display-name="getDisplayName"
      :is-dark="isDark"
      :high-detail="highDetail"
      @countries-loaded="handleCountriesLoaded"
    />
  </div>
</template>

<style scoped>
.app {
  width: 100%;
  height: 100%;
  position: relative;
}

.controls {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 100;
  background: var(--bg-panel);
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.projection-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: transparent;
  border: 1px solid var(--border-secondary);
  border-radius: 4px;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.projection-header:hover {
  border-color: var(--border-tertiary);
  color: var(--text-secondary);
}

.projection-header .icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.projection-header .current-projection {
  flex: 1;
  text-align: left;
}

.projection-header .chevron {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.projection-header .chevron.expanded {
  transform: rotate(180deg);
}

.projection-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.projection-btn {
  padding: 6px 8px;
  font-size: 11px;
  font-family: inherit;
  font-weight: 400;
  background: transparent;
  border: 1px solid var(--border-secondary);
  border-radius: 4px;
  color: var(--text-dimmed);
  cursor: pointer;
  transition: all 0.15s ease;
}

.projection-btn:hover {
  border-color: var(--border-tertiary);
  color: var(--text-muted);
}

.projection-btn.active {
  background: var(--btn-bg);
  border-color: var(--border-tertiary);
  color: var(--text-secondary);
}

.divider {
  height: 1px;
  background: var(--border-primary);
}

.toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0.01em;
  cursor: pointer;
  user-select: none;
}

.toggle.small {
  font-size: 12px;
}

.toggle input {
  display: none;
}

.checkbox {
  width: 14px;
  height: 14px;
  border: 1px solid var(--checkbox-border);
  border-radius: 3px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.toggle input:checked + .checkbox {
  background: var(--checkbox-bg);
  border-color: var(--checkbox-border);
}

.checkbox::after {
  content: '';
  width: 8px;
  height: 5px;
  border-left: 1.5px solid var(--checkbox-check);
  border-bottom: 1.5px solid var(--checkbox-check);
  transform: rotate(-45deg) translateY(-1px);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.toggle input:checked + .checkbox::after {
  opacity: 1;
}

.toggle:hover {
  color: var(--text-secondary);
}

.toggle:hover .checkbox {
  border-color: var(--border-tertiary);
}

.toggle.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: transparent;
  border: 1px solid var(--border-secondary);
  border-radius: 4px;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.theme-toggle:hover {
  border-color: var(--border-tertiary);
  color: var(--text-secondary);
}

.theme-toggle .icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Game Panel */
.game-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 100;
  background: var(--bg-panel);
  padding: 14px 16px;
  border-radius: 6px;
  border: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  min-width: 280px;
  touch-action: none;
}

.game-intro {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.game-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.game-desc {
  font-size: 12px;
  color: var(--text-dimmed);
}

.game-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.countries-display {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.country {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.country.start {
  background: var(--game-start-bg);
  color: var(--game-start-text);
}

.country.end {
  background: var(--game-end-bg);
  color: var(--game-end-text);
}

.arrow {
  color: var(--text-dimmed);
  font-size: 14px;
}

.game-stats {
  display: flex;
  gap: 12px;
}

.stat {
  font-size: 12px;
  color: var(--text-dimmed);
}

.game-controls {
  padding: 4px 0;
}

.path-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.paths-header {
  font-size: 11px;
  color: var(--text-dimmed);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.win-message {
  padding: 10px 12px;
  background: var(--accent-green-bg);
  border: 1px solid var(--accent-green-border);
  border-radius: 4px;
  color: var(--accent-green);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}

.path-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 12px;
}

.path-list.user-path {
  background: var(--accent-green-bg);
  border: 1px solid var(--accent-green-border);
}

.path-country {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.path-country .start {
  color: var(--accent-green);
}

.path-country .end {
  color: var(--accent-red);
}

.path-country .middle {
  color: var(--accent-blue);
}

.path-arrow {
  color: var(--border-tertiary);
  font-size: 10px;
}

/* Mobile styles */
@media (max-width: 768px) {
  .controls {
    display: none;
  }

  .game-panel {
    left: 16px;
    right: 16px;
    top: auto;
    bottom: 16px;
    min-width: auto;
  }
}

.guess-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-container {
  position: relative;
}

.input-wrapper {
  display: flex;
  gap: 6px;
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--bg-panel);
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.suggestion {
  padding: 8px 10px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.1s ease;
}

.suggestion:hover,
.suggestion.selected {
  background: var(--btn-bg);
}

.guess-input {
  flex: 1;
  padding: 8px 10px;
  font-size: 13px;
  font-family: inherit;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 4px;
  color: var(--input-text);
  outline: none;
  transition: all 0.15s ease;
}

.guess-input::placeholder {
  color: var(--input-placeholder);
}

.guess-input:focus {
  border-color: var(--border-tertiary);
}

.guess-input.error {
  border-color: var(--accent-red);
  background: var(--accent-red-bg);
}

.guess-input.success {
  border-color: var(--accent-green);
  background: var(--accent-green-bg);
}

.guess-btn {
  padding: 8px 14px;
  font-size: 12px;
  font-family: inherit;
  font-weight: 500;
  background: var(--btn-bg);
  border: 1px solid var(--btn-border);
  border-radius: 4px;
  color: var(--btn-text);
  cursor: pointer;
  transition: all 0.15s ease;
}

.guess-btn:hover {
  background: var(--btn-hover-bg);
  color: var(--text-secondary);
}

.feedback {
  font-size: 12px;
  min-height: 16px;
}

.feedback .correct {
  color: var(--accent-green);
}

.feedback .wrong {
  color: var(--accent-red);
}

.feedback .already {
  color: var(--accent-yellow);
}

.feedback .invalid {
  color: var(--text-muted);
}

.game-actions {
  display: flex;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px solid var(--border-primary);
  margin-top: 4px;
}

.game-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  font-family: inherit;
  font-weight: 500;
  background: var(--accent-blue-bg);
  border: 1px solid var(--accent-blue);
  border-radius: 4px;
  color: var(--accent-blue);
  cursor: pointer;
  transition: all 0.15s ease;
  opacity: 0.8;
}

.game-btn:hover {
  opacity: 1;
}

.game-btn.start {
  background: var(--accent-green-bg);
  border-color: var(--accent-green);
  color: var(--accent-green);
}

.game-btn.start:hover {
  opacity: 1;
}

.game-btn.secondary {
  background: transparent;
  border-color: var(--border-secondary);
  color: var(--text-dimmed);
  opacity: 1;
}

.game-btn.secondary:hover {
  border-color: var(--border-tertiary);
  color: var(--text-muted);
}
</style>
