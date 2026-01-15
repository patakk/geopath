import { ref, computed } from 'vue'
import { adjacencyData, codeToNames, excludedCountryCodes } from './countryData'

// Get display name for a code (first name in the list)
function getDisplayName(code) {
  return codeToNames[code]?.[0] || code
}

// Get all searchable country names (primary names only, for autocomplete)
function getAllCountryNames() {
  return Object.keys(codeToNames).map(code => codeToNames[code][0])
}

// Reverse lookup: map TopoJSON name to our code
function topoNameToCode(name) {
  if (!name) return null

  // Find the code that has this name
  for (const [code, names] of Object.entries(codeToNames)) {
    for (const n of names) {
      if (n.toLowerCase() === name.toLowerCase()) {
        return code
      }
    }
  }
  return null
}

export function useCountryGame() {
  const gameActive = ref(false)
  const blindMode = ref(false)
  const startCountry = ref(null)
  const endCountry = ref(null)
  const shortestPath = ref([])
  const allShortestPaths = ref([])
  const possiblePaths = ref([]) // Paths that are still possible based on guesses
  const guessedCountries = ref(new Set())
  const wrongGuesses = ref(new Set())
  const validPathCountries = ref(new Set())
  const countryInput = ref('')
  const gameWon = ref(false)
  const lastGuessResult = ref(null) // 'correct', 'wrong', 'already', 'invalid'
  const allCountryNames = ref([])

  function normalizeCountryName(name) {
    return topoNameToCode(name)
  }

  function getNeighbors(country) {
    return adjacencyData[country] || []
  }

  function findAllShortestPaths(start, end) {
    if (!start || !end || start === end) return []

    // First pass: BFS to find shortest distances to all nodes
    const distances = new Map([[start, 0]])
    const queue = [start]

    while (queue.length > 0) {
      const current = queue.shift()
      const currentDist = distances.get(current)

      for (const neighbor of getNeighbors(current)) {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, currentDist + 1)
          queue.push(neighbor)
        }
      }
    }

    if (!distances.has(end)) return [] // No path exists

    // Second pass: backtrack from end to find ALL shortest paths
    const allPaths = []

    function backtrack(current, path) {
      if (current === start) {
        allPaths.push([...path].reverse())
        return
      }

      const currentDist = distances.get(current)
      for (const neighbor of getNeighbors(current)) {
        if (distances.has(neighbor) && distances.get(neighbor) === currentDist - 1) {
          path.push(neighbor)
          backtrack(neighbor, path)
          path.pop()
        }
      }
    }

    backtrack(end, [end])
    return allPaths
  }

  function findShortestPath(start, end) {
    const paths = findAllShortestPaths(start, end)
    return paths.length > 0 ? paths[0] : []
  }

  function getAllValidCountries(paths) {
    const valid = new Set()
    for (const path of paths) {
      for (const country of path) {
        valid.add(country)
      }
    }
    return valid
  }

  function getValidCountries() {
    return Object.keys(adjacencyData).filter(c =>
      getNeighbors(c).length > 0 && !excludedCountryCodes.has(c)
    )
  }

  function startNewGame() {
    const validCountries = getValidCountries()
    let attempts = 0
    const maxAttempts = 100

    while (attempts < maxAttempts) {
      attempts++
      //const start = validCountries[Math.floor(Math.random() * validCountries.length)]
      //const end = validCountries[Math.floor(Math.random() * validCountries.length)]

      const start = 'THI'
      const end = 'ARM'

      if (start === end) continue

      // Check they're not neighbors
      if (getNeighbors(start).includes(end)) continue

      const allPaths = findAllShortestPaths(start, end)
      if (allPaths.length === 0) continue

      const path = allPaths[0]

      // Path should have 3-5 countries between start and end (so 5-10 total)
      if (path.length >= 5 && path.length <= 10) {
        startCountry.value = start
        endCountry.value = end
        shortestPath.value = path
        allShortestPaths.value = allPaths
        possiblePaths.value = [...allPaths] // Start with all paths as possible
        validPathCountries.value = getAllValidCountries(allPaths)
        guessedCountries.value = new Set([start, end])
        wrongGuesses.value = new Set()
        gameActive.value = true
        gameWon.value = false
        lastGuessResult.value = null
        countryInput.value = ''
        return true
      }
    }

    return false
  }

  // Match user input to a country code
  function matchGuessToCode(guess) {
    const lowerGuess = guess.toLowerCase()

    // Check if it's a direct code match
    if (adjacencyData[guess.toUpperCase()]) {
      return guess.toUpperCase()
    }

    // Search through codeToNames for a match
    for (const [code, names] of Object.entries(codeToNames)) {
      for (const name of names) {
        if (name.toLowerCase() === lowerGuess) {
          return code
        }
      }
    }

    return null
  }

  function makeGuess(guess) {
    if (!gameActive.value || gameWon.value) return

    const normalizedGuess = guess.trim()
    if (!normalizedGuess) return

    // Find matching country code
    const matchedCode = matchGuessToCode(normalizedGuess)

    if (!matchedCode) {
      lastGuessResult.value = 'invalid'
      return
    }

    if (guessedCountries.value.has(matchedCode) || wrongGuesses.value.has(matchedCode)) {
      lastGuessResult.value = 'already'
      return
    }

    // Check if this country appears in any of the possible paths
    const pathsWithCountry = possiblePaths.value.filter(path => path.includes(matchedCode))

    if (pathsWithCountry.length > 0) {
      // Country is valid - narrow down possible paths to only those containing it
      possiblePaths.value = pathsWithCountry
      validPathCountries.value = getAllValidCountries(possiblePaths.value)
      guessedCountries.value = new Set([...guessedCountries.value, matchedCode])
      lastGuessResult.value = 'correct'
      countryInput.value = ''

      // Check win condition - check if any possible path has all middle countries guessed
      for (const path of possiblePaths.value) {
        const middleCountries = path.slice(1, -1)
        if (middleCountries.every(c => guessedCountries.value.has(c))) {
          gameWon.value = true
          break
        }
      }
    } else {
      wrongGuesses.value = new Set([...wrongGuesses.value, matchedCode])
      lastGuessResult.value = 'wrong'
      countryInput.value = ''
    }
  }

  function endGame() {
    gameActive.value = false
    startCountry.value = null
    endCountry.value = null
    shortestPath.value = []
    allShortestPaths.value = []
    possiblePaths.value = []
    guessedCountries.value = new Set()
    wrongGuesses.value = new Set()
    validPathCountries.value = new Set()
    gameWon.value = false
    lastGuessResult.value = null
    countryInput.value = ''
  }

  function revealPath() {
    guessedCountries.value = new Set(shortestPath.value)
  }

  const foundCount = computed(() => {
    // Count all guessed countries that are valid (excluding start/end)
    return [...guessedCountries.value].filter(
      c => c !== startCountry.value && c !== endCountry.value
    ).length
  })

  const totalToFind = computed(() => {
    // Need to find (path length - 2) countries to win
    return Math.max(0, shortestPath.value.length - 2)
  })

  // Find if user completed a valid path and return it
  const userCompletedPath = computed(() => {
    if (!gameWon.value) return null
    // Find a path where all middle countries were guessed (from possible paths)
    for (const path of possiblePaths.value) {
      const middleCountries = path.slice(1, -1)
      if (middleCountries.every(c => guessedCountries.value.has(c))) {
        return path
      }
    }
    return null
  })

  // Get paths sorted with user's path first (if exists)
  const sortedPaths = computed(() => {
    if (!allShortestPaths.value.length) return []

    // If game is won, show all shortest paths with user's completed path first
    if (gameWon.value) {
      const userPath = userCompletedPath.value
      if (!userPath) return allShortestPaths.value
      return [
        userPath,
        ...allShortestPaths.value.filter(p => p !== userPath)
      ]
    }

    // If revealed/not won, show all shortest paths
    return allShortestPaths.value
  })

  return {
    gameActive,
    blindMode,
    startCountry,
    endCountry,
    shortestPath,
    allShortestPaths,
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
  }
}
