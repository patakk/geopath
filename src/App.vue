<script setup>
import { ref, watch } from 'vue'
import WorldMap from './components/WorldMap.vue'
import { useCountryGame } from './composables/useCountryGame'

const showLabels = ref(true)
const currentProjection = ref('mercator')
const projectionsExpanded = ref(false)

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
  startNewGame,
  makeGuess,
  endGame,
  revealPath
} = useCountryGame()

const inputRef = ref(null)

function handleCountriesLoaded(names) {
  allCountryNames.value = names
}

function handleGuessSubmit() {
  makeGuess(countryInput.value)
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
  if (e.key === 'Enter') {
    handleGuessSubmit()
  }
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
            <span class="country start">{{ startCountry }}</span>
            <span class="arrow">→</span>
            <span class="country end">{{ endCountry }}</span>
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
              }">{{ country }}</span>
              <span v-if="index < path.length - 1" class="path-arrow">→</span>
            </span>
          </div>
        </div>

        <div v-else class="guess-section">
          <div class="input-wrapper">
            <input
              ref="inputRef"
              v-model="countryInput"
              type="text"
              placeholder="Enter country name..."
              class="guess-input"
              @keydown="handleKeydown"
              :class="{
                'error': lastGuessResult === 'wrong' || lastGuessResult === 'invalid',
                'success': lastGuessResult === 'correct'
              }"
            />
            <button class="guess-btn" @click="handleGuessSubmit">Guess</button>
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
  background: rgba(20, 20, 20, 0.95);
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid #2a2a2a;
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
  border: 1px solid #333;
  border-radius: 4px;
  color: #808080;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.projection-header:hover {
  border-color: #444;
  color: #999;
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
  border: 1px solid #333;
  border-radius: 4px;
  color: #606060;
  cursor: pointer;
  transition: all 0.15s ease;
}

.projection-btn:hover {
  border-color: #444;
  color: #808080;
}

.projection-btn.active {
  background: #2a2a2a;
  border-color: #444;
  color: #999;
}

.divider {
  height: 1px;
  background: #2a2a2a;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #707070;
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
  border: 1px solid #444;
  border-radius: 3px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.toggle input:checked + .checkbox {
  background: #555;
  border-color: #666;
}

.checkbox::after {
  content: '';
  width: 8px;
  height: 5px;
  border-left: 1.5px solid #000;
  border-bottom: 1.5px solid #000;
  transform: rotate(-45deg) translateY(-1px);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.toggle input:checked + .checkbox::after {
  opacity: 1;
}

.toggle:hover {
  color: #909090;
}

.toggle:hover .checkbox {
  border-color: #555;
}

.toggle.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

/* Game Panel */
.game-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 100;
  background: rgba(20, 20, 20, 0.95);
  padding: 14px 16px;
  border-radius: 6px;
  border: 1px solid #2a2a2a;
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
  color: #aaa;
}

.game-desc {
  font-size: 12px;
  color: #606060;
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
  background: #1e5631;
  color: #4ade80;
}

.country.end {
  background: #7b1e1e;
  color: #f87171;
}

.arrow {
  color: #505050;
  font-size: 14px;
}

.game-stats {
  display: flex;
  gap: 12px;
}

.stat {
  font-size: 12px;
  color: #606060;
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
  color: #606060;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.win-message {
  padding: 10px 12px;
  background: #1e3a1e;
  border: 1px solid #2d5a2d;
  border-radius: 4px;
  color: #4ade80;
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
  background: #151515;
  border-radius: 4px;
  font-size: 12px;
}

.path-list.user-path {
  background: #1a2a1a;
  border: 1px solid #2d4a2d;
}

.path-country {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.path-country .start {
  color: #4ade80;
}

.path-country .end {
  color: #f87171;
}

.path-country .middle {
  color: #60a5fa;
}

.path-arrow {
  color: #444;
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

.input-wrapper {
  display: flex;
  gap: 6px;
}

.guess-input {
  flex: 1;
  padding: 8px 10px;
  font-size: 13px;
  font-family: inherit;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #ccc;
  outline: none;
  transition: all 0.15s ease;
}

.guess-input::placeholder {
  color: #505050;
}

.guess-input:focus {
  border-color: #555;
}

.guess-input.error {
  border-color: #7b1e1e;
  background: #1a1212;
}

.guess-input.success {
  border-color: #1e5631;
  background: #121a14;
}

.guess-btn {
  padding: 8px 14px;
  font-size: 12px;
  font-family: inherit;
  font-weight: 500;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #999;
  cursor: pointer;
  transition: all 0.15s ease;
}

.guess-btn:hover {
  background: #333;
  color: #bbb;
}

.feedback {
  font-size: 12px;
  min-height: 16px;
}

.feedback .correct {
  color: #4ade80;
}

.feedback .wrong {
  color: #f87171;
}

.feedback .already {
  color: #fbbf24;
}

.feedback .invalid {
  color: #888;
}

.game-actions {
  display: flex;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px solid #2a2a2a;
  margin-top: 4px;
}

.game-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  font-family: inherit;
  font-weight: 500;
  background: #2563eb20;
  border: 1px solid #2563eb40;
  border-radius: 4px;
  color: #60a5fa;
  cursor: pointer;
  transition: all 0.15s ease;
}

.game-btn:hover {
  background: #2563eb30;
  border-color: #2563eb60;
}

.game-btn.start {
  background: #1e563130;
  border-color: #1e563150;
  color: #4ade80;
}

.game-btn.start:hover {
  background: #1e563150;
  border-color: #1e563180;
}

.game-btn.secondary {
  background: transparent;
  border-color: #333;
  color: #606060;
}

.game-btn.secondary:hover {
  border-color: #444;
  color: #888;
}
</style>
