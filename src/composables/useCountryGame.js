import { ref, computed } from 'vue'
import * as topojson from 'topojson-client'

// Country adjacency data (manually curated for accuracy)
// This is more reliable than computing from TopoJSON borders
const adjacencyData = {
    "LIE": ["SWZ", "AUS"],
    "PAR": ["BRA", "BOL", "ARG"],
    "LIB": ["NIR", "CHA", "ALG", "TUN", "SUD", "EGY"],
    "QAT": ["SAU", "BAH", "UAE"],
    "SOM": ["KEN", "DJI", "ETH"],
    "BOS": ["CRO", "YUG", "MTG"],
    "BOT": ["ZAM", "ZIM", "SAF", "NAM"],
    "EGY": ["LIB", "SUD", "JOR", "ISR", "SAU"],
    "IRQ": ["IRN", "TUR", "SYR", "JOR", "SAU", "KUW"],
    "NAM": ["ANG", "ZAM", "SAF", "BOT"],
    "LIT": ["POL", "USR", "LAT", "BLR"],
    "BOL": ["PER", "BRA", "PAR", "CHL", "ARG"],
    "GHA": ["CDI", "BFO", "TOG"],
    "SIE": ["GUI", "LBR"],
    "DRC": ["CEN", "CON", "UGA", "TAZ", "BUI", "RWA", "ANG", "ZAM", "SUD"],
    "PAK": ["IRN", "AFG", "CHN", "IND", "MYA"],
    "SIN": ["MAL", "INS"],
    "YUG": ["HUN", "ALB", "MAC", "CRO", "BOS", "MTG", "BUL", "RUM"],
    "JOR": ["IRQ", "EGY", "SYR", "ISR", "SAU"],
    "LBR": ["CDI", "GUI", "SIE"],
    "SAL": ["GUA", "HON", "NIC"],
    "BNG": ["IND", "MYA"],
    "GAM": ["SEN"],
    "PRK": ["USR", "CHN", "ROK"],
    "KUW": ["IRN", "IRQ", "SAU"],
    "SPN": ["FRN", "AND", "POR", "MOR"],
    "MYA": ["CHN", "IND", "PAK", "BNG", "THI", "LAO"],
    "KYR": ["TAJ", "UZB", "KZK", "CHN"],
    "UAE": ["SAU", "QAT", "OMA"],
    "SAU": ["IRQ", "EGY", "JOR", "ISR", "YEM", "KUW", "BAH", "QAT", "UAE", "OMA"],
    "HAI": ["DOM"],
    "SVG": ["GRN", "SLU"],
    "BFO": ["MLI", "BEN", "NIR", "CDI", "GHA", "TOG"],
    "OMA": ["SAU", "YEM", "UAE"],
    "CHN": ["USR", "AFG", "TAJ", "KYR", "KZK", "MON", "TAW", "PRK", "IND", "BHU", "PAK", "MYA", "NEP", "LAO", "DRV"],
    "URU": ["BRA", "ARG"],
    "LAO": ["CHN", "MYA", "THI", "CAM", "DRV"],
    "THI": ["MYA", "CAM", "LAO", "MAL"],
    "DJI": ["SOM", "ETH", "ERI", "YEM"],
    "ZIM": ["MZM", "ZAM", "SAF", "BOT"],
    "FIN": ["USR", "EST", "SWD", "NOR"],
    "EQG": ["CAO", "GAB"],
    "PHI": ["MAL"],
    "ZAM": ["DRC", "TAZ", "ANG", "MZM", "ZIM", "MAW", "NAM", "BOT"],
    "YEM": ["DJI", "ERI", "SAU", "OMA"],
    "MAW": ["TAZ", "MZM", "ZAM"],
    "NIC": ["HON", "SAL", "COS"],
    "SNM": ["ITA"],
    "NIG": ["BEN", "NIR", "CAO", "CHA"],
    "MAA": ["MLI", "SEN", "MOR", "ALG"],
    "SYR": ["TUR", "IRQ", "LEB", "JOR", "ISR"],
    "MAC": ["ALB", "YUG", "GRC", "BUL"],
    "LAT": ["USR", "EST", "LIT", "BLR"],
    "MZM": ["TAZ", "ZAM", "ZIM", "MAW", "SAF", "SWA"],
    "MAL": ["THI", "SIN", "BRU", "PHI", "INS"],
    "GUA": ["MEX", "BLZ", "HON", "SAL"],
    "BEN": ["NIR", "BFO", "TOG", "NIG"],
    "BEL": ["NTH", "LUX", "FRN", "GMY"],
    "GUI": ["GNB", "MLI", "SEN", "CDI", "LBR", "SIE"],
    "DEN": ["GMY", "SWD"],
    "GUY": ["VEN", "SUR", "BRA"],
    "SKN": ["AAB"],
    "CRO": ["HUN", "ITA", "YUG", "BOS", "MTG", "SLV"],
    "ROK": ["PRK"],
    "NTH": ["BEL", "GMY"],
    "CEN": ["CAO", "CHA", "CON", "DRC", "SUD"],
    "HUN": ["AUS", "SLO", "CRO", "YUG", "SLV", "RUM", "UKR"],
    "TKM": ["IRN", "AFG", "UZB", "KZK"],
    "BUI": ["DRC", "TAZ", "RWA"],
    "PAN": ["COS", "COL"],
    "BUL": ["MAC", "YUG", "GRC", "RUM", "TUR"],
    "SLU": ["SVG"],
    "MNC": ["FRN"],
    "TRI": ["VEN"],
    "BLZ": ["MEX", "GUA"],
    "AFG": ["IRN", "TKM", "TAJ", "UZB", "CHN", "PAK"],
    "BLR": ["POL", "USR", "LAT", "LIT", "UKR"],
    "ETM": ["INS"],
    "GRG": ["USR", "ARM", "AZE", "TUR"],
    "TAW": ["CHN"],
    "GRC": ["ALB", "MAC", "BUL", "TUR"],
    "GRN": ["SVG"],
    "AND": ["FRN", "SPN"],
    "RWA": ["DRC", "UGA", "TAZ", "BUI"],
    "ANG": ["CON", "DRC", "ZAM", "NAM"],
    "SWD": ["FIN", "NOR", "DEN"],
    "MOR": ["SPN", "MAA", "ALG"],
    "INS": ["MAL", "SIN", "ETM", "PNG"],
    "MON": ["USR", "CHN"],
    "IND": ["CHN", "BHU", "PAK", "BNG", "MYA", "SRI", "NEP"],
    "NOR": ["USR", "FIN", "SWD"],
    "COS": ["NIC", "PAN"],
    "SUD": ["CEN", "CHA", "DRC", "UGA", "KEN", "ETH", "ERI", "LIB", "EGY"],
    "DOM": ["HAI"],
    "LUX": ["BEL", "FRN", "GMY"],
    "ISR": ["EGY", "SYR", "LEB", "JOR", "SAU"],
    "PER": ["COL", "ECU", "BRA", "BOL", "CHL"],
    "SAF": ["MZM", "ZIM", "NAM", "LES", "BOT", "SWA"],
    "SUR": ["GUY", "BRA"],
    "ETH": ["KEN", "SOM", "DJI", "ERI", "SUD"],
    "COL": ["VEN", "ECU", "PER", "BRA", "PAN"],
    "NEP": ["CHN", "IND"],
    "CON": ["CAO", "GAB", "CEN", "DRC", "ANG"],
    "SOL": ["PNG"],
    "AAB": ["SKN"],
    "IRE": ["UKG"],
    "ECU": ["COL", "PER"],
    "SEN": ["GNB", "GAM", "MLI", "MAA", "GUI"],
    "UGA": ["DRC", "KEN", "TAZ", "RWA", "SUD"],
    "SRI": ["IND"],
    "FRN": ["UKG", "BEL", "LUX", "MNC", "SWZ", "SPN", "AND", "GMY", "ITA"],
    "AZE": ["USR", "ARM", "GRG", "IRN", "TUR"],
    "GMY": ["NTH", "BEL", "LUX", "FRN", "SWZ", "POL", "AUS", "CZR", "DEN"],
    "VEN": ["COL", "GUY", "BRA", "TRI"],
    "KEN": ["UGA", "TAZ", "SOM", "ETH", "SUD"],
    "LEB": ["SYR", "ISR"],
    "RUM": ["HUN", "YUG", "BUL", "MLD", "UKR"],
    "ALG": ["MLI", "MAA", "NIR", "MOR", "TUN", "LIB"],
    "TUR": ["GRC", "CYP", "BUL", "ARM", "GRG", "AZE", "IRN", "IRQ", "SYR"],
    "ALB": ["MAC", "YUG", "MTG", "GRC"],
    "CDI": ["MLI", "GUI", "BFO", "LBR", "GHA"],
    "ITA": ["FRN", "SWZ", "AUS", "SNM", "CRO", "SLV"],
    "CZR": ["GMY", "POL", "AUS", "SLO"],
    "LES": ["SAF"],
    "TAJ": ["AFG", "KYR", "UZB", "CHN"],
    "TUN": ["ALG", "LIB"],
    "KZK": ["USR", "TKM", "KYR", "UZB", "CHN"],
    "MEX": ["USA", "BLZ", "GUA"],
    "BRA": ["COL", "VEN", "GUY", "SUR", "PER", "BOL", "PAR", "ARG", "URU"],
    "CAN": ["USA"],
    "USA": ["CAN", "MEX", "USR"],
    "CHA": ["NIR", "CAO", "NIG", "CEN", "LIB", "SUD"],
    "SWA": ["MZM", "SAF"],
    "UKR": ["POL", "HUN", "SLO", "MLD", "RUM", "USR", "BLR"],
    "GNB": ["SEN", "GUI"],
    "SWZ": ["FRN", "LIE", "GMY", "AUS", "ITA"],
    "CAO": ["EQG", "NIG", "GAB", "CEN", "CHA", "CON"],
    "USR": ["USA", "POL", "EST", "LAT", "LIT", "UKR", "BLR", "GRG", "AZE", "FIN", "NOR", "KZK", "CHN", "MON", "PRK", "JPN"],
    "CAM": ["THI", "LAO", "DRV"],
    "UKG": ["IRE", "FRN"],
    "TOG": ["BEN", "BFO", "GHA"],
    "BAH": ["SAU", "QAT"],
    "CYP": ["TUR"],
    "POR": ["SPN"],
    "BRU": ["MAL"],
    "UZB": ["AFG", "TKM", "TAJ", "KYR", "KZK"],
    "ERI": ["DJI", "ETH", "SUD", "YEM"],
    "POL": ["GMY", "CZR", "SLO", "USR", "LIT", "UKR", "BLR"],
    "GAB": ["EQG", "CAO", "CON"],
    "EST": ["USR", "LAT", "FIN"],
    "MLD": ["RUM", "UKR"],
    "HON": ["GUA", "SAL", "NIC"],
    "CHL": ["PER", "BOL", "ARG"],
    "SLV": ["AUS", "HUN", "ITA", "CRO"],
    "MLI": ["SEN", "MAA", "NIR", "CDI", "GUI", "BFO", "ALG"],
    "AUL": ["PNG"],
    "SLO": ["POL", "AUS", "HUN", "CZR", "UKR"],
    "IRN": ["ARM", "AZE", "TUR", "IRQ", "KUW", "AFG", "TKM", "PAK"],
    "MTG": ["ALB", "CRO", "YUG", "BOS"],
    "JPN": ["USR"],
    "TAZ": ["DRC", "UGA", "KEN", "BUI", "RWA", "MZM", "ZAM", "MAW"],
    "AUS": ["LIE", "SWZ", "GMY", "HUN", "CZR", "SLO", "ITA", "SLV"],
    "ARG": ["BRA", "BOL", "PAR", "CHL", "URU"],
    "DRV": ["CHN", "CAM", "LAO"],
    "NIR": ["MLI", "BEN", "BFO", "NIG", "CHA", "ALG", "LIB"],
    "BHU": ["CHN", "IND"],
    "ARM": ["GRG", "AZE", "IRN", "TUR"],
    "PNG": ["INS", "AUL", "SOL"]
}

// Map 3-letter codes to accepted name variations
const codeToNames = {
  "LIE": ["Liechtenstein"],
  "PAR": ["Paraguay"],
  "LIB": ["Libya"],
  "QAT": ["Qatar"],
  "SOM": ["Somalia"],
  "BOS": ["Bosnia and Herzegovina", "Bosnia", "Bosnia-Herzegovina", "BiH", "Bosnia and Herz."],
  "BOT": ["Botswana"],
  "EGY": ["Egypt"],
  "IRQ": ["Iraq"],
  "NAM": ["Namibia"],
  "LIT": ["Lithuania"],
  "BOL": ["Bolivia"],
  "GHA": ["Ghana"],
  "SIE": ["Sierra Leone"],
  "DRC": ["Democratic Republic of the Congo", "DR Congo", "D.R. Congo", "DRC", "Congo-Kinshasa", "Zaire", "Dem. Rep. Congo"],
  "PAK": ["Pakistan"],
  "SIN": ["Singapore"],
  "YUG": ["Serbia", "Yugoslavia"],
  "JOR": ["Jordan"],
  "LBR": ["Liberia"],
  "SAL": ["El Salvador", "Salvador"],
  "BNG": ["Bangladesh"],
  "GAM": ["Gambia", "The Gambia"],
  "PRK": ["North Korea", "DPRK", "D.P.R.K.", "Democratic People's Republic of Korea", "Dem. Rep. Korea"],
  "KUW": ["Kuwait"],
  "SPN": ["Spain", "España"],
  "MYA": ["Myanmar", "Burma", "Myanmar (Burma)"],
  "KYR": ["Kyrgyzstan", "Kirghizstan", "Kirgizstan"],
  "UAE": ["United Arab Emirates", "UAE", "U.A.E.", "Emirates"],
  "SAU": ["Saudi Arabia", "KSA", "K.S.A."],
  "HAI": ["Haiti"],
  "SVG": ["Saint Vincent and the Grenadines", "St. Vincent and the Grenadines", "St Vincent", "Saint Vincent", "SVG"],
  "BFO": ["Burkina Faso", "Burkina"],
  "OMA": ["Oman"],
  "CHN": ["China", "People's Republic of China", "PRC", "P.R.C."],
  "URU": ["Uruguay"],
  "LAO": ["Laos", "Lao", "Lao PDR"],
  "THI": ["Thailand"],
  "DJI": ["Djibouti"],
  "ZIM": ["Zimbabwe"],
  "FIN": ["Finland"],
  "EQG": ["Equatorial Guinea", "Eq. Guinea"],
  "PHI": ["Philippines", "The Philippines"],
  "ZAM": ["Zambia"],
  "YEM": ["Yemen"],
  "MAW": ["Malawi"],
  "NIC": ["Nicaragua"],
  "SNM": ["San Marino"],
  "NIG": ["Niger"],
  "MAA": ["Mauritania"],
  "SYR": ["Syria", "Syrian Arab Republic"],
  "MAC": ["North Macedonia", "Macedonia", "N. Macedonia", "FYROM"],
  "LAT": ["Latvia"],
  "MZM": ["Mozambique"],
  "MAL": ["Malaysia"],
  "GUA": ["Guatemala"],
  "BEN": ["Benin"],
  "BEL": ["Belgium"],
  "GUI": ["Guinea"],
  "DEN": ["Denmark"],
  "GUY": ["Guyana"],
  "SKN": ["Saint Kitts and Nevis", "St. Kitts and Nevis", "St Kitts", "Saint Kitts"],
  "CRO": ["Croatia"],
  "ROK": ["South Korea", "Korea", "Republic of Korea"],
  "NTH": ["Netherlands", "Holland", "The Netherlands"],
  "CEN": ["Central African Republic", "CAR", "C.A.R.", "Central African Rep."],
  "HUN": ["Hungary"],
  "TKM": ["Turkmenistan"],
  "BUI": ["Burundi"],
  "PAN": ["Panama"],
  "BUL": ["Bulgaria"],
  "SLU": ["Saint Lucia", "St. Lucia", "St Lucia"],
  "MNC": ["Monaco"],
  "TRI": ["Trinidad and Tobago", "Trinidad", "T&T"],
  "BLZ": ["Belize"],
  "AFG": ["Afghanistan"],
  "BLR": ["Belarus", "Belorussia", "Byelorussia"],
  "ETM": ["East Timor", "Timor-Leste", "Timor Leste"],
  "GRG": ["Georgia"],
  "TAW": ["Taiwan", "Republic of China", "ROC", "R.O.C."],
  "GRC": ["Greece"],
  "GRN": ["Grenada"],
  "AND": ["Andorra"],
  "RWA": ["Rwanda"],
  "ANG": ["Angola"],
  "SWD": ["Sweden"],
  "MOR": ["Morocco"],
  "INS": ["Indonesia"],
  "MON": ["Mongolia"],
  "IND": ["India"],
  "NOR": ["Norway"],
  "COS": ["Costa Rica"],
  "SUD": ["Sudan", "South Sudan", "S. Sudan"],
  "DOM": ["Dominican Republic", "Dominican Rep."],
  "LUX": ["Luxembourg"],
  "ISR": ["Israel"],
  "PER": ["Peru"],
  "SAF": ["South Africa", "RSA", "R.S.A."],
  "SUR": ["Suriname", "Surinam"],
  "ETH": ["Ethiopia"],
  "COL": ["Colombia"],
  "NEP": ["Nepal"],
  "CON": ["Republic of the Congo", "Congo", "Congo-Brazzaville", "Republic of Congo"],
  "SOL": ["Solomon Islands"],
  "AAB": ["Antigua and Barbuda", "Antigua"],
  "IRE": ["Ireland", "Republic of Ireland", "Eire"],
  "ECU": ["Ecuador"],
  "SEN": ["Senegal"],
  "UGA": ["Uganda"],
  "SRI": ["Sri Lanka", "Ceylon"],
  "FRN": ["France"],
  "AZE": ["Azerbaijan"],
  "GMY": ["Germany", "Deutschland"],
  "VEN": ["Venezuela"],
  "KEN": ["Kenya"],
  "LEB": ["Lebanon"],
  "RUM": ["Romania"],
  "ALG": ["Algeria"],
  "TUR": ["Turkey", "Türkiye", "Turkiye"],
  "ALB": ["Albania"],
  "CDI": ["Ivory Coast", "Côte d'Ivoire", "Cote d'Ivoire"],
  "ITA": ["Italy", "Italia"],
  "CZR": ["Czech Republic", "Czechia", "Czech"],
  "LES": ["Lesotho"],
  "TAJ": ["Tajikistan"],
  "TUN": ["Tunisia"],
  "KZK": ["Kazakhstan"],
  "MEX": ["Mexico", "México"],
  "BRA": ["Brazil", "Brasil"],
  "CAN": ["Canada"],
  "USA": ["United States of America", "United States", "USA", "U.S.A.", "US", "U.S.", "America"],
  "CHA": ["Chad"],
  "SWA": ["Eswatini", "Swaziland"],
  "UKR": ["Ukraine"],
  "GNB": ["Guinea-Bissau", "Guinea Bissau"],
  "SWZ": ["Switzerland"],
  "CAO": ["Cameroon"],
  "USR": ["Russia", "Russian Federation"],
  "CAM": ["Cambodia", "Kampuchea"],
  "UKG": ["United Kingdom", "UK", "U.K.", "Britain", "Great Britain", "England"],
  "TOG": ["Togo"],
  "BAH": ["Bahrain"],
  "CYP": ["Cyprus"],
  "POR": ["Portugal"],
  "BRU": ["Brunei", "Brunei Darussalam"],
  "UZB": ["Uzbekistan"],
  "ERI": ["Eritrea"],
  "POL": ["Poland", "Polska"],
  "GAB": ["Gabon"],
  "EST": ["Estonia"],
  "MLD": ["Moldova"],
  "HON": ["Honduras"],
  "CHL": ["Chile"],
  "SLV": ["Slovenia"],
  "MLI": ["Mali"],
  "AUL": ["Australia"],
  "SLO": ["Slovakia"],
  "IRN": ["Iran", "Persia", "Islamic Republic of Iran"],
  "MTG": ["Montenegro"],
  "JPN": ["Japan", "Nippon"],
  "TAZ": ["Tanzania"],
  "AUS": ["Austria"],
  "ARG": ["Argentina"],
  "DRV": ["Vietnam", "Viet Nam"],
  "NIR": ["Nigeria"],
  "BHU": ["Bhutan"],
  "ARM": ["Armenia"],
  "PNG": ["Papua New Guinea", "PNG", "P.N.G."]
}

// Territories to exclude from the game (islands, etc. not in adjacency data)
const excludedTerritories = new Set([
  "Fr. S. Antarctic Lands",
  "Antarctica",
  "Greenland",
  "Falkland Is.",
  "New Caledonia",
  "Solomon Is.",
  "Vanuatu",
  "Fiji",
  "New Zealand",
  "Puerto Rico",
  "Cuba",
  "Jamaica",
  "Trinidad and Tobago",
  "Bahamas",
  "Iceland",
  "Sri Lanka",
  "Madagascar",
  "Japan",
  "Philippines",
  "Taiwan",
  "Cyprus",
  "W. Sahara"
])

// Get display name for a code (first name in the list)
function getDisplayName(code) {
  return codeToNames[code]?.[0] || code
}

// Reverse lookup: map TopoJSON name to our code
function topoNameToCode(name) {
  if (!name) return null
  if (excludedTerritories.has(name)) return null

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

    if (validPathCountries.value.has(matchedCode)) {
      guessedCountries.value = new Set([...guessedCountries.value, matchedCode])
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
    getDisplayName,
    startNewGame,
    makeGuess,
    endGame,
    revealPath
  }
}
