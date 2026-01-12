import { ref, computed } from 'vue'
import * as topojson from 'topojson-client'

// Country adjacency data (manually curated for accuracy)
// This is more reliable than computing from TopoJSON borders
const adjacencyData = {
  "Afghanistan": ["China", "Iran", "Pakistan", "Tajikistan", "Turkmenistan", "Uzbekistan"],
  "Albania": ["Greece", "Kosovo", "Montenegro", "North Macedonia"],
  "Algeria": ["Libya", "Mali", "Mauritania", "Morocco", "Niger", "Tunisia", "Western Sahara"],
  "Andorra": ["France", "Spain"],
  "Angola": ["Democratic Republic of the Congo", "Namibia", "Republic of the Congo", "Zambia"],
  "Argentina": ["Bolivia", "Brazil", "Chile", "Paraguay", "Uruguay"],
  "Armenia": ["Azerbaijan", "Georgia", "Iran", "Turkey"],
  "Austria": ["Czech Republic", "Germany", "Hungary", "Italy", "Liechtenstein", "Slovakia", "Slovenia", "Switzerland"],
  "Azerbaijan": ["Armenia", "Georgia", "Iran", "Russia", "Turkey"],
  "Bangladesh": ["India", "Myanmar"],
  "Belarus": ["Latvia", "Lithuania", "Poland", "Russia", "Ukraine"],
  "Belgium": ["France", "Germany", "Luxembourg", "Netherlands"],
  "Belize": ["Guatemala", "Mexico"],
  "Benin": ["Burkina Faso", "Niger", "Nigeria", "Togo"],
  "Bhutan": ["China", "India"],
  "Bolivia": ["Argentina", "Brazil", "Chile", "Paraguay", "Peru"],
  "Bosnia and Herzegovina": ["Croatia", "Montenegro", "Serbia"],
  "Botswana": ["Namibia", "South Africa", "Zambia", "Zimbabwe"],
  "Brazil": ["Argentina", "Bolivia", "Colombia", "French Guiana", "Guyana", "Paraguay", "Peru", "Suriname", "Uruguay", "Venezuela"],
  "Brunei": ["Malaysia"],
  "Bulgaria": ["Greece", "North Macedonia", "Romania", "Serbia", "Turkey"],
  "Burkina Faso": ["Benin", "Ivory Coast", "Ghana", "Mali", "Niger", "Togo"],
  "Burundi": ["Democratic Republic of the Congo", "Rwanda", "Tanzania"],
  "Cambodia": ["Laos", "Thailand", "Vietnam"],
  "Cameroon": ["Central African Republic", "Chad", "Equatorial Guinea", "Gabon", "Nigeria", "Republic of the Congo"],
  "Canada": ["United States of America"],
  "Central African Republic": ["Cameroon", "Chad", "Democratic Republic of the Congo", "Republic of the Congo", "South Sudan", "Sudan"],
  "Chad": ["Cameroon", "Central African Republic", "Libya", "Niger", "Nigeria", "Sudan"],
  "Chile": ["Argentina", "Bolivia", "Peru"],
  "China": ["Afghanistan", "Bhutan", "India", "Kazakhstan", "Kyrgyzstan", "Laos", "Mongolia", "Myanmar", "Nepal", "North Korea", "Pakistan", "Russia", "Tajikistan", "Vietnam"],
  "Colombia": ["Brazil", "Ecuador", "Panama", "Peru", "Venezuela"],
  "Republic of the Congo": ["Angola", "Cameroon", "Central African Republic", "Democratic Republic of the Congo", "Gabon"],
  "Costa Rica": ["Nicaragua", "Panama"],
  "Croatia": ["Bosnia and Herzegovina", "Hungary", "Montenegro", "Serbia", "Slovenia"],
  "Czech Republic": ["Austria", "Germany", "Poland", "Slovakia"],
  "Democratic Republic of the Congo": ["Angola", "Burundi", "Central African Republic", "Republic of the Congo", "Rwanda", "South Sudan", "Tanzania", "Uganda", "Zambia"],
  "Denmark": ["Germany"],
  "Djibouti": ["Eritrea", "Ethiopia", "Somalia"],
  "Dominican Republic": ["Haiti"],
  "Ecuador": ["Colombia", "Peru"],
  "Egypt": ["Israel", "Libya", "Palestine", "Sudan"],
  "El Salvador": ["Guatemala", "Honduras"],
  "Equatorial Guinea": ["Cameroon", "Gabon"],
  "Eritrea": ["Djibouti", "Ethiopia", "Sudan"],
  "Estonia": ["Latvia", "Russia"],
  "Eswatini": ["Mozambique", "South Africa"],
  "Ethiopia": ["Djibouti", "Eritrea", "Kenya", "Somalia", "South Sudan", "Sudan"],
  "Finland": ["Norway", "Russia", "Sweden"],
  "France": ["Andorra", "Belgium", "Germany", "Italy", "Luxembourg", "Monaco", "Spain", "Switzerland"],
  "French Guiana": ["Brazil", "Suriname"],
  "Gabon": ["Cameroon", "Equatorial Guinea", "Republic of the Congo"],
  "Gambia": ["Senegal"],
  "Georgia": ["Armenia", "Azerbaijan", "Russia", "Turkey"],
  "Germany": ["Austria", "Belgium", "Czech Republic", "Denmark", "France", "Luxembourg", "Netherlands", "Poland", "Switzerland"],
  "Ghana": ["Burkina Faso", "Ivory Coast", "Togo"],
  "Greece": ["Albania", "Bulgaria", "North Macedonia", "Turkey"],
  "Guatemala": ["Belize", "El Salvador", "Honduras", "Mexico"],
  "Guinea": ["Guinea-Bissau", "Ivory Coast", "Liberia", "Mali", "Senegal", "Sierra Leone"],
  "Guinea-Bissau": ["Guinea", "Senegal"],
  "Guyana": ["Brazil", "Suriname", "Venezuela"],
  "Haiti": ["Dominican Republic"],
  "Honduras": ["El Salvador", "Guatemala", "Nicaragua"],
  "Hungary": ["Austria", "Croatia", "Romania", "Serbia", "Slovakia", "Slovenia", "Ukraine"],
  "India": ["Bangladesh", "Bhutan", "China", "Myanmar", "Nepal", "Pakistan"],
  "Indonesia": ["Malaysia", "Papua New Guinea", "East Timor"],
  "Iran": ["Afghanistan", "Armenia", "Azerbaijan", "Iraq", "Pakistan", "Turkey", "Turkmenistan"],
  "Iraq": ["Iran", "Jordan", "Kuwait", "Saudi Arabia", "Syria", "Turkey"],
  "Ireland": ["United Kingdom"],
  "Israel": ["Egypt", "Jordan", "Lebanon", "Palestine", "Syria"],
  "Italy": ["Austria", "France", "San Marino", "Slovenia", "Switzerland", "Vatican City"],
  "Ivory Coast": ["Burkina Faso", "Ghana", "Guinea", "Liberia", "Mali"],
  "Jordan": ["Iraq", "Israel", "Palestine", "Saudi Arabia", "Syria"],
  "Kazakhstan": ["China", "Kyrgyzstan", "Russia", "Turkmenistan", "Uzbekistan"],
  "Kenya": ["Ethiopia", "Somalia", "South Sudan", "Tanzania", "Uganda"],
  "Kosovo": ["Albania", "Montenegro", "North Macedonia", "Serbia"],
  "Kuwait": ["Iraq", "Saudi Arabia"],
  "Kyrgyzstan": ["China", "Kazakhstan", "Tajikistan", "Uzbekistan"],
  "Laos": ["Cambodia", "China", "Myanmar", "Thailand", "Vietnam"],
  "Latvia": ["Belarus", "Estonia", "Lithuania", "Russia"],
  "Lebanon": ["Israel", "Syria"],
  "Lesotho": ["South Africa"],
  "Liberia": ["Guinea", "Ivory Coast", "Sierra Leone"],
  "Libya": ["Algeria", "Chad", "Egypt", "Niger", "Sudan", "Tunisia"],
  "Liechtenstein": ["Austria", "Switzerland"],
  "Lithuania": ["Belarus", "Latvia", "Poland", "Russia"],
  "Luxembourg": ["Belgium", "France", "Germany"],
  "North Macedonia": ["Albania", "Bulgaria", "Greece", "Kosovo", "Serbia"],
  "Malawi": ["Mozambique", "Tanzania", "Zambia"],
  "Malaysia": ["Brunei", "Indonesia", "Thailand"],
  "Mali": ["Algeria", "Burkina Faso", "Guinea", "Ivory Coast", "Mauritania", "Niger", "Senegal"],
  "Mauritania": ["Algeria", "Mali", "Senegal", "Western Sahara"],
  "Mexico": ["Belize", "Guatemala", "United States of America"],
  "Moldova": ["Romania", "Ukraine"],
  "Monaco": ["France"],
  "Mongolia": ["China", "Russia"],
  "Montenegro": ["Albania", "Bosnia and Herzegovina", "Croatia", "Kosovo", "Serbia"],
  "Morocco": ["Algeria", "Western Sahara", "Spain"],
  "Mozambique": ["Eswatini", "Malawi", "South Africa", "Tanzania", "Zambia", "Zimbabwe"],
  "Myanmar": ["Bangladesh", "China", "India", "Laos", "Thailand"],
  "Namibia": ["Angola", "Botswana", "South Africa", "Zambia"],
  "Nepal": ["China", "India"],
  "Netherlands": ["Belgium", "Germany"],
  "Nicaragua": ["Costa Rica", "Honduras"],
  "Niger": ["Algeria", "Benin", "Burkina Faso", "Chad", "Libya", "Mali", "Nigeria"],
  "Nigeria": ["Benin", "Cameroon", "Chad", "Niger"],
  "North Korea": ["China", "Russia", "South Korea"],
  "Norway": ["Finland", "Russia", "Sweden"],
  "Oman": ["Saudi Arabia", "United Arab Emirates", "Yemen"],
  "Pakistan": ["Afghanistan", "China", "India", "Iran"],
  "Palestine": ["Egypt", "Israel", "Jordan"],
  "Panama": ["Colombia", "Costa Rica"],
  "Papua New Guinea": ["Indonesia"],
  "Paraguay": ["Argentina", "Bolivia", "Brazil"],
  "Peru": ["Bolivia", "Brazil", "Chile", "Colombia", "Ecuador"],
  "Poland": ["Belarus", "Czech Republic", "Germany", "Lithuania", "Russia", "Slovakia", "Ukraine"],
  "Portugal": ["Spain"],
  "Qatar": ["Saudi Arabia"],
  "Romania": ["Bulgaria", "Hungary", "Moldova", "Serbia", "Ukraine"],
  "Russia": ["Azerbaijan", "Belarus", "China", "Estonia", "Finland", "Georgia", "Kazakhstan", "Latvia", "Lithuania", "Mongolia", "North Korea", "Norway", "Poland", "Ukraine"],
  "Rwanda": ["Burundi", "Democratic Republic of the Congo", "Tanzania", "Uganda"],
  "San Marino": ["Italy"],
  "Saudi Arabia": ["Iraq", "Jordan", "Kuwait", "Oman", "Qatar", "United Arab Emirates", "Yemen"],
  "Senegal": ["Gambia", "Guinea", "Guinea-Bissau", "Mali", "Mauritania"],
  "Serbia": ["Bosnia and Herzegovina", "Bulgaria", "Croatia", "Hungary", "Kosovo", "Montenegro", "North Macedonia", "Romania"],
  "Sierra Leone": ["Guinea", "Liberia"],
  "Slovakia": ["Austria", "Czech Republic", "Hungary", "Poland", "Ukraine"],
  "Slovenia": ["Austria", "Croatia", "Hungary", "Italy"],
  "Somalia": ["Djibouti", "Ethiopia", "Kenya"],
  "South Africa": ["Botswana", "Eswatini", "Lesotho", "Mozambique", "Namibia", "Zimbabwe"],
  "South Korea": ["North Korea"],
  "South Sudan": ["Central African Republic", "Democratic Republic of the Congo", "Ethiopia", "Kenya", "Sudan", "Uganda"],
  "Spain": ["Andorra", "France", "Gibraltar", "Morocco", "Portugal"],
  "Sudan": ["Central African Republic", "Chad", "Egypt", "Eritrea", "Ethiopia", "Libya", "South Sudan"],
  "Suriname": ["Brazil", "French Guiana", "Guyana"],
  "Sweden": ["Finland", "Norway"],
  "Switzerland": ["Austria", "France", "Germany", "Italy", "Liechtenstein"],
  "Syria": ["Iraq", "Israel", "Jordan", "Lebanon", "Turkey"],
  "Taiwan": [],
  "Tajikistan": ["Afghanistan", "China", "Kyrgyzstan", "Uzbekistan"],
  "Tanzania": ["Burundi", "Democratic Republic of the Congo", "Kenya", "Malawi", "Mozambique", "Rwanda", "Uganda", "Zambia"],
  "Thailand": ["Cambodia", "Laos", "Malaysia", "Myanmar"],
  "East Timor": ["Indonesia"],
  "Togo": ["Benin", "Burkina Faso", "Ghana"],
  "Tunisia": ["Algeria", "Libya"],
  "Turkey": ["Armenia", "Azerbaijan", "Bulgaria", "Georgia", "Greece", "Iran", "Iraq", "Syria"],
  "Turkmenistan": ["Afghanistan", "Iran", "Kazakhstan", "Uzbekistan"],
  "Uganda": ["Democratic Republic of the Congo", "Kenya", "Rwanda", "South Sudan", "Tanzania"],
  "Ukraine": ["Belarus", "Hungary", "Moldova", "Poland", "Romania", "Russia", "Slovakia"],
  "United Arab Emirates": ["Oman", "Saudi Arabia"],
  "United Kingdom": ["Ireland"],
  "United States of America": ["Canada", "Mexico"],
  "Uruguay": ["Argentina", "Brazil"],
  "Uzbekistan": ["Afghanistan", "Kazakhstan", "Kyrgyzstan", "Tajikistan", "Turkmenistan"],
  "Vatican City": ["Italy"],
  "Venezuela": ["Brazil", "Colombia", "Guyana"],
  "Vietnam": ["Cambodia", "China", "Laos"],
  "Western Sahara": ["Algeria", "Mauritania", "Morocco"],
  "Yemen": ["Oman", "Saudi Arabia"],
  "Zambia": ["Angola", "Botswana", "Democratic Republic of the Congo", "Malawi", "Mozambique", "Namibia", "Tanzania", "Zimbabwe"],
  "Zimbabwe": ["Botswana", "Mozambique", "South Africa", "Zambia"]
}

// Name mappings for TopoJSON data
const nameAliases = {
  "United States": "United States of America",
  "Dem. Rep. Congo": "Democratic Republic of the Congo",
  "Congo": "Republic of the Congo",
  "Central African Rep.": "Central African Republic",
  "S. Sudan": "South Sudan",
  "Côte d'Ivoire": "Ivory Coast",
  "Bosnia and Herz.": "Bosnia and Herzegovina",
  "Macedonia": "North Macedonia",
  "N. Macedonia": "North Macedonia",
  "Czech Rep.": "Czech Republic",
  "Czechia": "Czech Republic",
  "Dominican Rep.": "Dominican Republic",
  "Eq. Guinea": "Equatorial Guinea",
  "W. Sahara": "Western Sahara",
  "Timor-Leste": "East Timor",
  "Korea": "South Korea",
  "Dem. Rep. Korea": "North Korea",
  "Lao PDR": "Laos",
  "Myanmar (Burma)": "Myanmar",
  "eSwatini": "Eswatini",
  "Swaziland": "Eswatini",
  "Fr. S. Antarctic Lands": null,
  "Antarctica": null,
  "Greenland": null,
  "Falkland Is.": null,
  "New Caledonia": null,
  "Solomon Is.": null,
  "Vanuatu": null,
  "Fiji": null,
  "New Zealand": null,
  "Puerto Rico": null,
  "Cuba": null,
  "Jamaica": null,
  "Trinidad and Tobago": null,
  "Bahamas": null,
  "Iceland": null,
  "Sri Lanka": null,
  "Madagascar": null,
  "Japan": null,
  "Philippines": null,
  "Taiwan": null,
  "Cyprus": null,
  "Australia": null
}

export function useCountryGame() {
  const gameActive = ref(false)
  const blindMode = ref(false)
  const startCountry = ref(null)
  const endCountry = ref(null)
  const shortestPath = ref([])
  const allShortestPaths = ref([])
  const guessedCountries = ref(new Set())
  const wrongGuesses = ref(new Set())
  const validPathCountries = ref(new Set())
  const countryInput = ref('')
  const gameWon = ref(false)
  const lastGuessResult = ref(null) // 'correct', 'wrong', 'already', 'invalid'
  const allCountryNames = ref([])

  function normalizeCountryName(name) {
    if (!name) return null
    if (nameAliases[name] !== undefined) return nameAliases[name]
    return name
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
    return Object.keys(adjacencyData).filter(c => getNeighbors(c).length > 0)
  }

  function startNewGame() {
    const validCountries = getValidCountries()
    let attempts = 0
    const maxAttempts = 100

    while (attempts < maxAttempts) {
      attempts++
      const start = validCountries[Math.floor(Math.random() * validCountries.length)]
      const end = validCountries[Math.floor(Math.random() * validCountries.length)]

      if (start === end) continue

      // Check they're not neighbors
      if (getNeighbors(start).includes(end)) continue

      const allPaths = findAllShortestPaths(start, end)
      if (allPaths.length === 0) continue

      const path = allPaths[0]

      // Path should have 3-5 countries between start and end (so 5-7 total)
      if (path.length >= 5 && path.length <= 7) {
        startCountry.value = start
        endCountry.value = end
        shortestPath.value = path
        allShortestPaths.value = allPaths
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

  function makeGuess(guess) {
    if (!gameActive.value || gameWon.value) return

    const normalizedGuess = guess.trim()
    if (!normalizedGuess) return

    // Find matching country (case insensitive)
    const matchedCountry = allCountryNames.value.find(
      name => name.toLowerCase() === normalizedGuess.toLowerCase()
    ) || Object.keys(adjacencyData).find(
      name => name.toLowerCase() === normalizedGuess.toLowerCase()
    )

    if (!matchedCountry) {
      lastGuessResult.value = 'invalid'
      return
    }

    if (guessedCountries.value.has(matchedCountry) || wrongGuesses.value.has(matchedCountry)) {
      lastGuessResult.value = 'already'
      return
    }

    if (validPathCountries.value.has(matchedCountry)) {
      guessedCountries.value = new Set([...guessedCountries.value, matchedCountry])
      lastGuessResult.value = 'correct'
      countryInput.value = ''

      // Check win condition - need to guess (pathLength - 2) middle countries
      const middleCountriesNeeded = shortestPath.value.length - 2
      const middleCountriesGuessed = [...guessedCountries.value].filter(
        c => c !== startCountry.value && c !== endCountry.value
      ).length
      if (middleCountriesGuessed >= middleCountriesNeeded) {
        gameWon.value = true
      }
    } else {
      wrongGuesses.value = new Set([...wrongGuesses.value, matchedCountry])
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
    // Find a path where all middle countries were guessed
    for (const path of allShortestPaths.value) {
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
    const userPath = userCompletedPath.value
    if (!userPath) return allShortestPaths.value
    // Put user's path first, then others
    return [
      userPath,
      ...allShortestPaths.value.filter(p => p !== userPath)
    ]
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
    startNewGame,
    makeGuess,
    endGame,
    revealPath
  }
}
