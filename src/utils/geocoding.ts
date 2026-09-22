// Polish cities and district coordinates database for instant accurate geocoding

export interface Coordinates {
  lat: number;
  lng: number;
}

// Major Polish Cities and their coordinates
export const POLISH_CITIES: Record<string, Coordinates> = {
  'warszawa': { lat: 52.2297, lng: 21.0122 },
  'warsaw': { lat: 52.2297, lng: 21.0122 },
  'kraków': { lat: 50.0647, lng: 19.9450 },
  'krakow': { lat: 50.0647, lng: 19.9450 },
  'wrocław': { lat: 51.1079, lng: 17.0385 },
  'wroclaw': { lat: 51.1079, lng: 17.0385 },
  'poznań': { lat: 52.4064, lng: 16.9252 },
  'poznan': { lat: 52.4064, lng: 16.9252 },
  'gdańsk': { lat: 54.3520, lng: 18.6466 },
  'gdansk': { lat: 54.3520, lng: 18.6466 },
  'gdynia': { lat: 54.5189, lng: 18.5305 },
  'sopot': { lat: 54.4418, lng: 18.5601 },
  'łódź': { lat: 51.7592, lng: 19.4560 },
  'lodz': { lat: 51.7592, lng: 19.4560 },
  'szczecin': { lat: 53.4285, lng: 14.5528 },
  'lublin': { lat: 51.2465, lng: 22.5684 },
  'katowice': { lat: 50.2649, lng: 19.0238 },
  'bydgoszcz': { lat: 53.1235, lng: 18.0084 },
  'białystok': { lat: 53.1325, lng: 23.1688 },
  'bialystok': { lat: 53.1325, lng: 23.1688 },
  'rzeszów': { lat: 50.0412, lng: 21.9991 },
  'rzeszow': { lat: 50.0412, lng: 21.9991 },
  'toruń': { lat: 53.0138, lng: 18.5984 },
  'torun': { lat: 53.0138, lng: 18.5984 },
  'kielce': { lat: 50.8661, lng: 20.6286 },
  'radom': { lat: 51.4027, lng: 21.1471 },
  'częstochowa': { lat: 50.8118, lng: 19.1203 },
  'czestochowa': { lat: 50.8118, lng: 19.1203 },
  'gliwice': { lat: 50.2945, lng: 18.6714 },
  'sosnowiec': { lat: 50.2863, lng: 19.1041 },
  'zabrze': { lat: 50.3249, lng: 18.7857 },
  'bielsko-biała': { lat: 49.8225, lng: 19.0444 },
  'olsztyn': { lat: 53.7784, lng: 20.4801 },
  'zielona góra': { lat: 51.9356, lng: 15.5062 },
  'opole': { lat: 50.6751, lng: 17.9213 },
  'gorzów wielkopolski': { lat: 52.7368, lng: 15.2288 },
  'dębica': { lat: 50.0515, lng: 21.4114 },
  'tarnów': { lat: 50.0121, lng: 20.9858 }
};

// Major Districts within Polish Metropolises
export const POLISH_DISTRICTS: Record<string, Coordinates> = {
  // Warszawa
  'śródmieście': { lat: 52.2319, lng: 21.0067 },
  'srodmiescie': { lat: 52.2319, lng: 21.0067 },
  'mokotów': { lat: 52.1939, lng: 21.0318 },
  'mokotow': { lat: 52.1939, lng: 21.0318 },
  'wola': { lat: 52.2381, lng: 20.9634 },
  'ursynów': { lat: 52.1415, lng: 21.0326 },
  'ursynow': { lat: 52.1415, lng: 21.0326 },
  'ochota': { lat: 52.2132, lng: 20.9784 },
  'praga-południe': { lat: 52.2366, lng: 21.0825 },
  'praga południe': { lat: 52.2366, lng: 21.0825 },
  'praga-północ': { lat: 52.2575, lng: 21.0336 },
  'praga północ': { lat: 52.2575, lng: 21.0336 },
  'saska kępa': { lat: 52.2289, lng: 21.0558 },
  'bielany': { lat: 52.2854, lng: 20.9388 },
  'żoliborz': { lat: 52.2687, lng: 20.9797 },
  'zoliborz': { lat: 52.2687, lng: 20.9797 },
  'bemowo': { lat: 52.2494, lng: 20.9103 },
  'targówek': { lat: 52.2818, lng: 21.0567 },
  'targowek': { lat: 52.2818, lng: 21.0567 },
  'wilanów': { lat: 52.1645, lng: 21.0894 },
  'wilanow': { lat: 52.1645, lng: 21.0894 },
  'białołęka': { lat: 52.3274, lng: 21.0142 },
  'bialoleka': { lat: 52.3274, lng: 21.0142 },
  'ursus': { lat: 52.1978, lng: 20.8872 },
  'włochy': { lat: 52.1932, lng: 20.9317 },
  'wlochy': { lat: 52.1932, lng: 20.9317 },
  'wawer': { lat: 52.2036, lng: 21.1611 },
  'gocław': { lat: 52.2289, lng: 21.0850 },
  'młociny': { lat: 52.2965, lng: 20.9287 },
  'kabaty': { lat: 52.1311, lng: 21.0647 },
  'stary mokotów': { lat: 52.2045, lng: 21.0189 },

  // Kraków
  'stare miasto': { lat: 50.0619, lng: 19.9373 },
  'kazimierz': { lat: 50.0519, lng: 19.9453 },
  'krowodrza': { lat: 50.0754, lng: 19.9242 },
  'podgórze': { lat: 50.0435, lng: 19.9542 },
  'podgorze': { lat: 50.0435, lng: 19.9542 },
  'grzegórzki': { lat: 50.0601, lng: 19.9678 },
  'grzegorzki': { lat: 50.0601, lng: 19.9678 },
  'prądnik czerwony': { lat: 50.0886, lng: 19.9723 },
  'prądnik biały': { lat: 50.0963, lng: 19.9338 },
  'dębniki': { lat: 50.0401, lng: 19.9192 },
  'debniki': { lat: 50.0401, lng: 19.9192 },
  'bronowice': { lat: 50.0805, lng: 19.8893 },
  'nowa huta': { lat: 50.0722, lng: 20.0375 },
  'czyżyny': { lat: 50.0708, lng: 20.0078 },
  'ruczaj': { lat: 50.0234, lng: 19.9076 },
  'zabłocie': { lat: 50.0478, lng: 19.9634 },

  // Wrocław
  'krzyki': { lat: 51.0825, lng: 17.0142 },
  'fabryczna': { lat: 51.1215, lng: 16.9632 },
  'psie pole': { lat: 51.1558, lng: 17.1147 },
  'nadodrze': { lat: 51.1205, lng: 17.0345 },
  'ołbin': { lat: 51.1245, lng: 17.0512 },
  'biskupin': { lat: 51.1012, lng: 17.0984 },
  'tarnogaj': { lat: 51.0834, lng: 17.0592 },
  'gaj': { lat: 51.0845, lng: 17.0423 },
  'jagodno': { lat: 51.0645, lng: 17.0654 },
  'popowice': { lat: 51.1256, lng: 16.9945 },

  // Poznań
  'jeżyce': { lat: 52.4184, lng: 16.8976 },
  'jezyce': { lat: 52.4184, lng: 16.8976 },
  'grunwald': { lat: 52.3956, lng: 16.8834 },
  'wilda': { lat: 52.3923, lng: 16.9245 },
  'rataje': { lat: 52.3912, lng: 16.9534 },
  'piątkowo': { lat: 52.4612, lng: 16.9145 },
  'winogrady': { lat: 52.4345, lng: 16.9312 },
  'łazarz': { lat: 52.3987, lng: 16.9034 },

  // Trójmiasto
  'przymorze': { lat: 54.4089, lng: 18.5876 },
  'wrzeszcz': { lat: 54.3812, lng: 18.6045 },
  'oliwa': { lat: 54.4067, lng: 18.5589 },
  'zaspa': { lat: 54.3945, lng: 18.6012 },
  'morena': { lat: 54.3589, lng: 18.5876 },
  'jasień': { lat: 54.3412, lng: 18.5634 },
  'orłowo': { lat: 54.4812, lng: 18.5512 },
  'redłowo': { lat: 54.4967, lng: 18.5412 },
  'chwarzno': { lat: 54.5123, lng: 18.4456 }
};

// Seeded pseudo-random generator for consistent deterministic jitter per property ID or title
function hashStringToFloat(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return ((Math.abs(hash) % 1000) / 1000) - 0.5; // -0.5 to 0.5
}

/**
 * Resolves coordinates from property location string or existing lat/lng.
 * If multiple properties are in the same district or city, applies subtle,
 * consistent deterministic jitter so markers don't overlap directly on top of each other.
 */
export function resolvePropertyCoordinates(
  location: string,
  propertyKey: string,
  existingLat?: number,
  existingLng?: number
): Coordinates | null {
  // If valid coordinates already provided
  if (
    typeof existingLat === 'number' &&
    typeof existingLng === 'number' &&
    !isNaN(existingLat) &&
    !isNaN(existingLng) &&
    existingLat >= 48 &&
    existingLat <= 55 &&
    existingLng >= 13 &&
    existingLng <= 25
  ) {
    return { lat: existingLat, lng: existingLng };
  }

  if (!location || typeof location !== 'string') {
    // Default to central Poland (Warszawa)
    return { lat: 52.2297, lng: 21.0122 };
  }

  const clean = location.toLowerCase().trim();
  let baseCoords: Coordinates | null = null;
  let jitterRadius = 0.006; // ~600m offset for visual clarity

  // 1. Check if a known specific district is mentioned
  for (const [district, coords] of Object.entries(POLISH_DISTRICTS)) {
    if (clean.includes(district)) {
      baseCoords = coords;
      jitterRadius = 0.004; // ~400m inside district
      break;
    }
  }

  // 2. If no district matched, match city
  if (!baseCoords) {
    for (const [city, coords] of Object.entries(POLISH_CITIES)) {
      if (clean.includes(city)) {
        baseCoords = coords;
        jitterRadius = 0.012; // ~1.2km across city
        break;
      }
    }
  }

  // 3. Fallback to Warsaw if in Poland
  if (!baseCoords) {
    baseCoords = POLISH_CITIES['warszawa'];
    jitterRadius = 0.018;
  }

  // Deterministic micro-jitter to prevent marker stacking
  const key = `${propertyKey}_${location}`;
  const jitterLat = hashStringToFloat(key + '_lat') * jitterRadius;
  const jitterLng = hashStringToFloat(key + '_lng') * jitterRadius;

  return {
    lat: Number((baseCoords.lat + jitterLat).toFixed(5)),
    lng: Number((baseCoords.lng + jitterLng).toFixed(5))
  };
}
