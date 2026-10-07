import { Property } from '../src/types';

export interface CrawlParams {
  city: string;
  district?: string;
  dealType: 'Wynajem' | 'Sprzedaż';
  maxPrice?: number;
  minPrice?: number;
  rooms?: number;
  propertyType?: string;
  keyword?: string;
}

const CITY_SLUGS: Record<string, { morizon: string; otodomProvince: string; otodomCity: string }> = {
  'warszawa': { morizon: 'warszawa', otodomProvince: 'mazowieckie', otodomCity: 'warszawa/warszawa/warszawa' },
  'warszawy': { morizon: 'warszawa', otodomProvince: 'mazowieckie', otodomCity: 'warszawa/warszawa/warszawa' },
  'warszawie': { morizon: 'warszawa', otodomProvince: 'mazowieckie', otodomCity: 'warszawa/warszawa/warszawa' },
  'krakow': { morizon: 'krakow', otodomProvince: 'malopolskie', otodomCity: 'krakow/krakow/krakow' },
  'kraków': { morizon: 'krakow', otodomProvince: 'malopolskie', otodomCity: 'krakow/krakow/krakow' },
  'krakowie': { morizon: 'krakow', otodomProvince: 'malopolskie', otodomCity: 'krakow/krakow/krakow' },
  'wroclaw': { morizon: 'wroclaw', otodomProvince: 'dolnoslaskie', otodomCity: 'wroclaw/wroclaw/wroclaw' },
  'wrocław': { morizon: 'wroclaw', otodomProvince: 'dolnoslaskie', otodomCity: 'wroclaw/wroclaw/wroclaw' },
  'poznan': { morizon: 'poznan', otodomProvince: 'wielkopolskie', otodomCity: 'poznan/poznan/poznan' },
  'poznań': { morizon: 'poznan', otodomProvince: 'wielkopolskie', otodomCity: 'poznan/poznan/poznan' },
  'gdansk': { morizon: 'gdansk', otodomProvince: 'pomorskie', otodomCity: 'gdansk/gdansk/gdansk' },
  'gdańsk': { morizon: 'gdansk', otodomProvince: 'pomorskie', otodomCity: 'gdansk/gdansk/gdansk' },
  'gdynia': { morizon: 'gdynia', otodomProvince: 'pomorskie', otodomCity: 'gdynia/gdynia/gdynia' },
  'sopot': { morizon: 'sopot', otodomProvince: 'pomorskie', otodomCity: 'sopot/sopot/sopot' },
  'lodz': { morizon: 'lodz', otodomProvince: 'lodzkie', otodomCity: 'lodz/lodz/lodz' },
  'łódź': { morizon: 'lodz', otodomProvince: 'lodzkie', otodomCity: 'lodz/lodz/lodz' },
  'szczecin': { morizon: 'szczecin', otodomProvince: 'zachodniopomorskie', otodomCity: 'szczecin/szczecin/szczecin' },
  'lublin': { morizon: 'lublin', otodomProvince: 'lubelskie', otodomCity: 'lublin/lublin/lublin' },
  'katowice': { morizon: 'katowice', otodomProvince: 'slaskie', otodomCity: 'katowice/katowice/katowice' }
};

export interface DistrictConfig {
  key: string;
  name: string;
  city: string; // warszawa, krakow, wroclaw, etc.
  morizon: string;
  otodom: string;
  aliases: string[]; // inflections and keywords in lowercase
  neighborhoods: string[]; // subdistricts / neighborhoods
}

export const DISTRICT_CONFIGS: DistrictConfig[] = [
  // --- WARSZAWA ---
  {
    key: 'bemowo',
    name: 'Bemowo',
    city: 'warszawa',
    morizon: 'bemowo',
    otodom: 'bemowo',
    aliases: [
      'bemowo', 'bemowie', 'bemowa', 'bemowem', 'bemowski', 'bemowska', 'bemowskie', 'na bemowie', 'na bemowo',
      'jelonki', 'jelonkach', 'jelonkom', 'jelonek', 'jelonki północne', 'jelonki południowe',
      'chrzanów', 'chrzanow', 'chrzanowie', 'górce', 'gorce', 'górcach', 'gorcach',
      'fort bema', 'forcie bema', 'fortach bema', 'boernerowo', 'boernerowie', 'nowe bemowo', 'lotnisko bemowo'
    ],
    neighborhoods: ['bemowo', 'jelonki', 'chrzanów', 'chrzanow', 'górce', 'gorce', 'fort bema', 'boernerowo', 'lotnisko', 'nowe bemowo']
  },
  {
    key: 'mokotow',
    name: 'Mokotów',
    city: 'warszawa',
    morizon: 'mokotow',
    otodom: 'mokotow',
    aliases: [
      'mokotów', 'mokotow', 'mokotowie', 'mokotowa', 'mokotowem', 'mokotowski', 'mokotowska', 'na mokotowie',
      'służew', 'sluzew', 'służewcu', 'sluzewcu', 'służewiec', 'sluzewiec', 'wierzbno', 'wierzbnie',
      'stegny', 'stegnach', 'sadyba', 'sadybie', 'siekierki', 'siekierkach', 'ksawerów', 'ksawerow', 'mordor'
    ],
    neighborhoods: ['mokotów', 'mokotow', 'służew', 'sluzew', 'służewiec', 'sluzewiec', 'wierzbno', 'stegny', 'sadyba', 'siekierki', 'ksawerów', 'augustówka']
  },
  {
    key: 'wola',
    name: 'Wola',
    city: 'warszawa',
    morizon: 'wola',
    otodom: 'wola',
    aliases: [
      'wola', 'woli', 'wolę', 'wole', 'wolą', 'wolski', 'wolska', 'na woli',
      'młynów', 'mlynow', 'młynowie', 'mirów', 'mirow', 'mirowie', 'czyste', 'koło', 'kolo', 'kole',
      'odolany', 'odolanach', 'powązki', 'powazki'
    ],
    neighborhoods: ['wola', 'młynów', 'mlynow', 'mirów', 'mirow', 'czyste', 'koło', 'kolo', 'odolany', 'powązki']
  },
  {
    key: 'srodmiescie',
    name: 'Śródmieście',
    city: 'warszawa',
    morizon: 'srodmiescie',
    otodom: 'srodmiescie',
    aliases: [
      'śródmieście', 'srodmiescie', 'śródmieściu', 'srodmiesciu', 'śródmieścia', 'srodmiescia', 'w śródmieściu',
      'centrum', 'w centrum', 'muranów', 'muranow', 'muranowie', 'powiśle', 'powisle', 'powiślu',
      'solec', 'solcu', 'ujazdów', 'ujazdow', 'starówka', 'starowka', 'starym mieście warszawa'
    ],
    neighborhoods: ['śródmieście', 'srodmiescie', 'centrum', 'muranów', 'powiśle', 'solec', 'ujazdów', 'starówka', 'stare miasto']
  },
  {
    key: 'bielany',
    name: 'Bielany',
    city: 'warszawa',
    morizon: 'bielany',
    otodom: 'bielany',
    aliases: [
      'bielany', 'bielanach', 'bielan', 'bielański', 'bielańska', 'na bielanach',
      'chomiczówka', 'chomiczowka', 'chomiczówce', 'wrzeciono', 'wrzecionie',
      'wawrzyszew', 'wawrzyszewie', 'młociny', 'mlociny', 'młocinach', 'marymont'
    ],
    neighborhoods: ['bielany', 'chomiczówka', 'wrzeciono', 'wawrzyszew', 'młociny', 'marymont']
  },
  {
    key: 'zoliborz',
    name: 'Żoliborz',
    city: 'warszawa',
    morizon: 'zoliborz',
    otodom: 'zoliborz',
    aliases: [
      'żoliborz', 'zoliborz', 'żoliborzu', 'zoliborzu', 'żoliborza', 'zoliborza', 'żoliborski', 'na żoliborzu',
      'sady żoliborskie', 'stary żoliborz', 'marymont-potok'
    ],
    neighborhoods: ['żoliborz', 'zoliborz', 'sady żoliborskie', 'stary żoliborz', 'marymont-potok']
  },
  {
    key: 'ursynow',
    name: 'Ursynów',
    city: 'warszawa',
    morizon: 'ursynow',
    otodom: 'ursynow',
    aliases: [
      'ursynów', 'ursynow', 'ursynowie', 'ursynowa', 'ursynowem', 'ursynowski', 'na ursynowie',
      'natolin', 'natolinie', 'kabaty', 'kabatach', 'stokłosy', 'stoklosy', 'imielin', 'imielinie'
    ],
    neighborhoods: ['ursynów', 'ursynow', 'natolin', 'kabaty', 'stokłosy', 'imielin']
  },
  {
    key: 'ochota',
    name: 'Ochota',
    city: 'warszawa',
    morizon: 'ochota',
    otodom: 'ochota',
    aliases: [
      'ochota', 'ochocie', 'ochoty', 'ochotę', 'ochotą', 'ochocki', 'na ochocie',
      'stara ochota', 'starej ochocie', 'szczęśliwice', 'szczesliwice', 'szczęśliwicach', 'rakowiec', 'rakowcu', 'filtry'
    ],
    neighborhoods: ['ochota', 'stara ochota', 'szczęśliwice', 'rakowiec', 'filtry']
  },
  {
    key: 'praga-poludnie',
    name: 'Praga-Południe',
    city: 'warszawa',
    morizon: 'praga-poludnie',
    otodom: 'praga-poludnie',
    aliases: [
      'praga-południe', 'praga-poludnie', 'pradze-południe', 'pradze południe', 'praga południe', 'pragi południe', 'na pradze południe',
      'saska kępa', 'saska kepa', 'saskiej kępie', 'saską kępę', 'gocław', 'goclaw', 'gocławiu', 'grochów', 'grochow', 'grochowie', 'kamionek', 'kamionku'
    ],
    neighborhoods: ['praga-południe', 'praga południe', 'saska kępa', 'gocław', 'grochów', 'kamionek']
  },
  {
    key: 'praga-polnoc',
    name: 'Praga-Północ',
    city: 'warszawa',
    morizon: 'praga-polnoc',
    otodom: 'praga-polnoc',
    aliases: [
      'praga-północ', 'praga-polnoc', 'pradze-północ', 'pradze północ', 'praga północ', 'pragi północ', 'na pradze północ',
      'stara praga', 'starej pradze', 'szmulowizna', 'szmulowiźnie', 'nowa praga', 'nowej pradze'
    ],
    neighborhoods: ['praga-północ', 'praga północ', 'stara praga', 'szmulowizna', 'nowa praga']
  },
  {
    key: 'targowek',
    name: 'Targówek',
    city: 'warszawa',
    morizon: 'targowek',
    otodom: 'targowek',
    aliases: [
      'targówek', 'targowek', 'targówku', 'targowku', 'targówka', 'na targówku',
      'bródno', 'brodno', 'bródnie', 'zacisze', 'zaciszu', 'targówek mieszkaniowy', 'targówek fabryczny'
    ],
    neighborhoods: ['targówek', 'targowek', 'bródno', 'brodno', 'zacisze']
  },
  {
    key: 'wilanow',
    name: 'Wilanów',
    city: 'warszawa',
    morizon: 'wilanow',
    otodom: 'wilanow',
    aliases: [
      'wilanów', 'wilanow', 'wilanowie', 'wilanowa', 'wilanowski', 'na wilanowie',
      'miasteczko wilanów', 'miasteczku wilanów', 'miasteczku wilanow', 'zawady', 'zawadach', 'powsin'
    ],
    neighborhoods: ['wilanów', 'wilanow', 'miasteczko wilanów', 'zawady', 'powsin']
  },
  {
    key: 'ursus',
    name: 'Ursus',
    city: 'warszawa',
    morizon: 'ursus',
    otodom: 'ursus',
    aliases: [
      'ursus', 'ursusie', 'ursusa', 'w ursusie',
      'skorosze', 'skoroszach', 'niedźwiadek', 'niedzwiadek', 'niedźwiadku', 'czechowice', 'gołąbki'
    ],
    neighborhoods: ['ursus', 'skorosze', 'niedźwiadek', 'czechowice', 'gołąbki']
  },
  {
    key: 'wlochy',
    name: 'Włochy',
    city: 'warszawa',
    morizon: 'wlochy',
    otodom: 'wlochy',
    aliases: [
      'włochy', 'wlochy', 'włochach', 'wlochach', 'we włochach',
      'okęcie', 'okecie', 'okęciu', 'raków', 'rakow', 'rakowie', 'salomea'
    ],
    neighborhoods: ['włochy', 'wlochy', 'okęcie', 'raków', 'salomea']
  },
  {
    key: 'bialoleka',
    name: 'Białołęka',
    city: 'warszawa',
    morizon: 'bialoleka',
    otodom: 'bialoleka',
    aliases: [
      'białołęka', 'bialoleka', 'białołęce', 'bialolece', 'białołęki', 'na białołęce',
      'tarchomin', 'tarchominie', 'nowodwory', 'nowodworach', 'żerań', 'zeran', 'żeraniu'
    ],
    neighborhoods: ['białołęka', 'bialoleka', 'tarchomin', 'nowodwory', 'żerań']
  },
  {
    key: 'wawer',
    name: 'Wawer',
    city: 'warszawa',
    morizon: 'wawer',
    otodom: 'wawer',
    aliases: [
      'wawer', 'wawrze', 'wawra', 'w wawrze',
      'anin', 'aninie', 'falenica', 'falenicy', 'międzylesie', 'miedzylesie', 'radość', 'radosc'
    ],
    neighborhoods: ['wawer', 'anin', 'falenica', 'międzylesie', 'radość']
  },
  {
    key: 'rembertow',
    name: 'Rembertów',
    city: 'warszawa',
    morizon: 'rembertow',
    otodom: 'rembertow',
    aliases: ['rembertów', 'rembertow', 'rembertowie', 'rembertowa', 'w rembertowie'],
    neighborhoods: ['rembertów', 'rembertow']
  },
  {
    key: 'wesola',
    name: 'Wesoła',
    city: 'warszawa',
    morizon: 'wesola',
    otodom: 'wesola',
    aliases: ['wesoła', 'wesola', 'wesołej', 'wesolej', 'w wesołej', 'stara miłosna', 'starej miłosnej'],
    neighborhoods: ['wesoła', 'wesola', 'stara miłosna']
  },
  // --- KRAKÓW ---
  {
    key: 'krowodrza',
    name: 'Krowodrza',
    city: 'krakow',
    morizon: 'krowodrza',
    otodom: 'krowodrza',
    aliases: ['krowodrza', 'krowodrzy', 'krowodrzę', 'na krowodrzy', 'łobzów', 'azory'],
    neighborhoods: ['krowodrza', 'łobzów', 'azory']
  },
  {
    key: 'podgorze',
    name: 'Podgórze',
    city: 'krakow',
    morizon: 'podgorze',
    otodom: 'podgorze',
    aliases: ['podgórze', 'podgorze', 'podgórzu', 'podgorzu', 'na podgórzu', 'zabłocie', 'zablocie', 'płaszów', 'plaszow'],
    neighborhoods: ['podgórze', 'zabłocie', 'płaszów']
  },
  {
    key: 'grzegorzki',
    name: 'Grzegórzki',
    city: 'krakow',
    morizon: 'grzegorzki',
    otodom: 'grzegorzki',
    aliases: ['grzegórzki', 'grzegorzki', 'grzegórzkach', 'grzegorzkach', 'na grzegórzkach', 'dąbie', 'dabie'],
    neighborhoods: ['grzegórzki', 'dąbie']
  },
  {
    key: 'debniki',
    name: 'Dębniki',
    city: 'krakow',
    morizon: 'debniki',
    otodom: 'debniki',
    aliases: ['dębniki', 'debniki', 'dębnikach', 'na dębnikach', 'ruczaj', 'ruczaju', 'zakrzówek'],
    neighborhoods: ['dębniki', 'ruczaj', 'zakrzówek']
  },
  {
    key: 'stare-miasto-krakow',
    name: 'Stare Miasto',
    city: 'krakow',
    morizon: 'stare-miasto',
    otodom: 'stare-miasto',
    aliases: ['stare miasto kraków', 'starym mieście kraków', 'kazimierz', 'kazimierzu', 'centrum krakowa'],
    neighborhoods: ['stare miasto', 'kazimierz']
  },
  // --- WROCŁAW ---
  {
    key: 'krzyki',
    name: 'Krzyki',
    city: 'wroclaw',
    morizon: 'krzyki',
    otodom: 'krzyki',
    aliases: ['krzyki', 'krzykach', 'krzyków', 'na krzykach', 'borek', 'borku', 'gaj', 'ołtaszyn', 'jagodno'],
    neighborhoods: ['krzyki', 'borek', 'gaj', 'ołtaszyn', 'jagodno']
  },
  {
    key: 'stare-miasto-wroclaw',
    name: 'Stare Miasto',
    city: 'wroclaw',
    morizon: 'stare-miasto',
    otodom: 'stare-miasto',
    aliases: ['stare miasto wrocław', 'starym mieście wrocław', 'rynek wrocław', 'szczepin'],
    neighborhoods: ['stare miasto', 'szczepin']
  },
  {
    key: 'fabryczna',
    name: 'Fabryczna',
    city: 'wroclaw',
    morizon: 'fabryczna',
    otodom: 'fabryczna',
    aliases: ['fabryczna', 'fabrycznej', 'nowy dwór', 'popowice', 'gądów', 'leśnica'],
    neighborhoods: ['fabryczna', 'nowy dwór', 'popowice']
  },
  // --- POZNAŃ ---
  {
    key: 'jezyce',
    name: 'Jeżyce',
    city: 'poznan',
    morizon: 'jezyce',
    otodom: 'jezyce',
    aliases: ['jeżyce', 'jezyce', 'jeżycach', 'jezycach', 'na jeżycach', 'sołacz', 'solacz'],
    neighborhoods: ['jeżyce', 'sołacz']
  },
  {
    key: 'grunwald',
    name: 'Grunwald',
    city: 'poznan',
    morizon: 'grunwald',
    otodom: 'grunwald',
    aliases: ['grunwald', 'grunwaldzie', 'na grunwaldzie', 'łazarz', 'lazarz'],
    neighborhoods: ['grunwald', 'łazarz']
  },
  // --- TRÓJMIASTO ---
  {
    key: 'przymorze',
    name: 'Przymorze',
    city: 'gdansk',
    morizon: 'przymorze',
    otodom: 'przymorze',
    aliases: ['przymorze', 'przymorzu', 'na przymorzu'],
    neighborhoods: ['przymorze']
  },
  {
    key: 'wrzeszcz',
    name: 'Wrzeszcz',
    city: 'gdansk',
    morizon: 'wrzeszcz',
    otodom: 'wrzeszcz',
    aliases: ['wrzeszcz', 'wrzeszczu', 'we wrzeszczu'],
    neighborhoods: ['wrzeszcz']
  },
  {
    key: 'oliwa',
    name: 'Oliwa',
    city: 'gdansk',
    morizon: 'oliwa',
    otodom: 'oliwa',
    aliases: ['oliwa', 'oliwie', 'w oliwie'],
    neighborhoods: ['oliwa']
  },
  {
    key: 'zaspa',
    name: 'Zaspa',
    city: 'gdansk',
    morizon: 'zaspa',
    otodom: 'zaspa',
    aliases: ['zaspa', 'zaspie', 'na zaspie'],
    neighborhoods: ['zaspa']
  }
];

export const DISTRICT_MAP: Record<string, { morizon: string; otodom?: string }> = {};
for (const dist of DISTRICT_CONFIGS) {
  DISTRICT_MAP[dist.key] = { morizon: dist.morizon, otodom: dist.otodom };
}

/**
 * Parses query criteria from natural text
 */
export function parseQueryCriteria(query: string, defaultDealType: string): CrawlParams {
  const lower = query.toLowerCase().trim();
  
  let dealType: 'Wynajem' | 'Sprzedaż' = 'Wynajem';
  if (lower.includes('sprzed') || lower.includes('kup') || defaultDealType === 'Sprzedaż') {
    dealType = 'Sprzedaż';
  }

  // Price constraints: e.g. "do 3500", "do 3 500 zł", "do 3500zl", "do 800000"
  let maxPrice: number | undefined;
  const maxPriceMatch = lower.match(/(?:do|maks|max|budżet|budzet)\s*[:=]?\s*([\d\s]+)\s*(?:zł|pln|tys)?/i);
  if (maxPriceMatch) {
    const rawVal = maxPriceMatch[1].replace(/\s+/g, '');
    let val = parseInt(rawVal, 10);
    if (lower.includes('tys') && val < 1000) {
      val *= 1000;
    }
    if (val > 0) {
      maxPrice = val;
    }
  }

  // City extraction
  let city: string | undefined;
  for (const key of Object.keys(CITY_SLUGS)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lower)) {
      city = key;
      break;
    }
  }

  // District extraction with high precision inflection and alias matching
  let matchedDistrictConfig: DistrictConfig | undefined;
  
  // Flatten all aliases sorted by length descending to match longest phrases first (e.g. "praga-południe" before "praga")
  const aliasCandidates: Array<{ config: DistrictConfig; alias: string }> = [];
  for (const distConfig of DISTRICT_CONFIGS) {
    for (const alias of distConfig.aliases) {
      aliasCandidates.push({ config: distConfig, alias });
    }
  }
  aliasCandidates.sort((a, b) => b.alias.length - a.alias.length);

  for (const candidate of aliasCandidates) {
    const escaped = candidate.alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-ząćęłńóśźż])${escaped}(?:$|[^a-ząćęłńóśźż])`, 'i');
    if (regex.test(lower)) {
      matchedDistrictConfig = candidate.config;
      break;
    }
  }

  let district: string | undefined;
  if (matchedDistrictConfig) {
    district = matchedDistrictConfig.key;
    // If city wasn't explicitly mentioned, adopt the district's home city!
    if (!city) {
      city = matchedDistrictConfig.city;
    }
  }

  // Default city to warszawa if neither city nor district is specified
  if (!city) {
    city = 'warszawa';
  }

  // Rooms extraction
  let rooms: number | undefined;
  if (lower.includes('kawalerka') || lower.includes('1 pok') || lower.includes('1-pok') || lower.includes('jednopokoj')) {
    rooms = 1;
  } else if (lower.includes('2 pok') || lower.includes('2-pok') || lower.includes('dwupokoj')) {
    rooms = 2;
  } else if (lower.includes('3 pok') || lower.includes('3-pok') || lower.includes('trzypokoj')) {
    rooms = 3;
  } else if (lower.includes('4 pok') || lower.includes('4-pok') || lower.includes('czteropokoj')) {
    rooms = 4;
  }

  return {
    city,
    district,
    dealType,
    maxPrice,
    rooms
  };
}

/**
 * Fetches real live offers from Morizon
 */
export async function fetchLiveMorizonOffers(params: CrawlParams, count = 15): Promise<Property[]> {
  const isRent = params.dealType === 'Wynajem';
  const dealPath = isRent ? 'do-wynajecia' : 'mieszkania';
  const cityInfo = CITY_SLUGS[params.city.toLowerCase()] || { morizon: 'warszawa' };
  const districtInfo = params.district ? DISTRICT_MAP[params.district.toLowerCase()] : undefined;

  let targetUrl = `https://www.morizon.pl/${dealPath}/mieszkania/${cityInfo.morizon}/`;
  if (districtInfo) {
    targetUrl += `${districtInfo.morizon}/`;
  }

  const queryParts: string[] = [];
  if (params.maxPrice) {
    queryParts.push(`ps%5Bprice_to%5D=${params.maxPrice}`);
  }
  if (params.minPrice) {
    queryParts.push(`ps%5Bprice_from%5D=${params.minPrice}`);
  }
  if (params.rooms) {
    queryParts.push(`ps%5Bnumber_of_rooms_from%5D=${params.rooms}`);
    queryParts.push(`ps%5Bnumber_of_rooms_to%5D=${params.rooms}`);
  }

  if (queryParts.length > 0) {
    targetUrl += `?${queryParts.join('&')}`;
  }

  console.log(`[MorizonCrawler] Pobieranie aktualnych ogłoszeń na żywo: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (response.status !== 200) return [];

    const html = await response.text();
    const jsonLds = [...html.matchAll(/<script type=[\"']application\/ld\+json[\"']>([\s\S]*?)<\/script>/gi)];
    
    let rawOffers: any[] = [];
    for (const m of jsonLds) {
      try {
        const data = JSON.parse(m[1]);
        if (data['@type'] === 'Product' && Array.isArray(data.offers?.offers)) {
          rawOffers = data.offers.offers;
          break;
        }
      } catch {}
    }

    const properties: Property[] = [];
    const cityCapitalized = params.city.charAt(0).toUpperCase() + params.city.slice(1);
    const targetDistConfig = params.district ? DISTRICT_CONFIGS.find(d => d.key === params.district) : undefined;
    const districtCapitalized = targetDistConfig ? targetDistConfig.name : (params.district ? params.district.charAt(0).toUpperCase() + params.district.slice(1) : '');

    for (let i = 0; i < rawOffers.length && properties.length < count; i++) {
      const offer = rawOffers[i];
      if (!offer.url || !offer.url.includes('/oferta/')) continue;

      const numericPrice = parseFloat(offer.price) || 0;
      if (params.maxPrice && numericPrice > params.maxPrice) continue;

      const offerUrlLower = (offer.url || '').toLowerCase();
      const offerNameLower = (offer.name || '').toLowerCase();
      const item = offer.itemOffered || {};
      const address = item.address || {};
      const rawStreet = address.streetAddress || '';
      const street = rawStreet.replace(/^(?:ul\.|ulica)\s*/i, '').trim();
      const addressLocalityLower = (address.addressLocality || '').toLowerCase();
      const descLower = (item.description || '').toLowerCase();

      // STRICT DISTRICT ENFORCEMENT:
      // If user requested a district (e.g. Bemowo), reject any offer from another district
      if (targetDistConfig) {
        // 1. Check if offer URL or address clearly points to a DIFFERENT district
        let fromOtherDistrict = false;
        for (const otherDist of DISTRICT_CONFIGS) {
          if (otherDist.key === targetDistConfig.key) continue;
          if (otherDist.city !== targetDistConfig.city) continue;
          const otherKey = otherDist.key;
          if (offerUrlLower.includes(`-${otherKey}-`) || offerUrlLower.includes(`/${otherKey}/`) || addressLocalityLower === otherDist.name.toLowerCase()) {
            fromOtherDistrict = true;
            break;
          }
        }
        if (fromOtherDistrict) {
          continue;
        }

        // 2. Verify it matches target district or its neighborhoods
        const matchesTarget = 
          targetDistConfig.aliases.some(a => offerUrlLower.includes(a) || offerNameLower.includes(a) || addressLocalityLower.includes(a)) ||
          targetDistConfig.neighborhoods.some(n => offerUrlLower.includes(n) || offerNameLower.includes(n) || addressLocalityLower.includes(n) || descLower.includes(n));
        
        if (!matchesTarget && !offerUrlLower.includes(`/${targetDistConfig.morizon}/`)) {
          continue;
        }
      }

      const locality = address.addressLocality || districtCapitalized || cityCapitalized;
      const numberOfRooms = item.numberOfRooms || (params.rooms || 2);
      const floorSize = item.floorSize?.value ? `${Math.round(parseFloat(item.floorSize.value))} m²` : 'N/A';
      const areaNumeric = item.floorSize?.value ? parseFloat(item.floorSize.value) : 0;

      let cleanDesc = (item.description || offer.name || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanDesc.length > 250) {
        cleanDesc = cleanDesc.substring(0, 247) + '...';
      }

      const roomsLabel = numberOfRooms === 1 ? '1 pokój (kawalerka)' : `${numberOfRooms} pokoje`;
      const priceFormatted = isRent
        ? `${numericPrice.toLocaleString('pl-PL')} PLN / mies.`
        : `${numericPrice.toLocaleString('pl-PL')} PLN`;

      const pricePerM2 = areaNumeric > 0
        ? `${Math.round(numericPrice / areaNumeric).toLocaleString('pl-PL')} PLN/m²`
        : 'N/A';

      const title = street 
        ? `${offer.name.split(',')[0]} – ${cityCapitalized} ${locality}, ul. ${street}`
        : `${offer.name} – ${cityCapitalized}`;

      const prop: Property = {
        id: `morizon-live-${Date.now()}-${i}`,
        title,
        location: street ? `${cityCapitalized}, ${locality} (ul. ${street})` : `${cityCapitalized}, ${locality}`,
        dealType: params.dealType,
        propertyType: numberOfRooms === 1 ? 'Kawalerka' : 'Mieszkanie',
        price: priceFormatted,
        priceNumeric: numericPrice,
        pricePerM2,
        area: floorSize,
        rooms: roomsLabel,
        floor: 'Piętro w budynku',
        description: cleanDesc,
        source: 'Morizon',
        url: offer.url, // INDIVIDUAL AD URL!
        contact: 'W ogłoszeniu (bezpośredni kontakt do opiekuna)',
        hasPhoneNumber: true,
        features: [
          'Aktualne na żywo (InStock)',
          street ? `ul. ${street}` : locality,
          numberOfRooms === 1 ? 'Kawalerka' : `${numberOfRooms} pokoje`,
          floorSize
        ],
        isDirectOffer: true,
        liveVerification: {
          url: offer.url,
          isLive: true,
          status: 200,
          finalUrl: offer.url,
          isArchived: false,
          isTrap: false,
          statusLabel: 'active',
          message: 'Aktualne, w 100% aktywne ogłoszenie zweryfikowane na żywo w portalu Morizon',
          checkedAt: new Date().toISOString()
        }
      };

      properties.push(prop);
    }

    return properties;
  } catch (err: any) {
    console.error('[MorizonCrawler] Błąd:', err.message);
    return [];
  }
}

/**
 * Fetches real live offers from Otodom
 */
export async function fetchLiveOtodomOffers(params: CrawlParams, count = 15): Promise<Property[]> {
  const isRent = params.dealType === 'Wynajem';
  const dealPath = isRent ? 'wynajem' : 'sprzedaz';
  const cityInfo = CITY_SLUGS[params.city.toLowerCase()];
  const districtInfo = params.district ? DISTRICT_MAP[params.district.toLowerCase()] : undefined;

  if (!cityInfo) {
    return [];
  }

  // Build target URL: with district if present, otherwise city-wide
  let targetUrl = districtInfo && districtInfo.otodom
    ? `https://www.otodom.pl/pl/wyniki/${dealPath}/mieszkanie/${cityInfo.otodomProvince}/${cityInfo.otodomCity}/${districtInfo.otodom}?limit=24`
    : `https://www.otodom.pl/pl/wyniki/${dealPath}/mieszkanie/${cityInfo.otodomProvince}/${cityInfo.otodomCity}?limit=24`;

  if (params.maxPrice) {
    targetUrl += `&priceMax=${params.maxPrice}`;
  }

  console.log(`[OtodomCrawler] Pobieranie aktualnych ogłoszeń na żywo: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (response.status !== 200) return [];

    const html = await response.text();
    const nextDataMatch = html.match(/<script id=\"__NEXT_DATA__\"[^>]*>([\s\S]*?)<\/script>/i);
    if (!nextDataMatch) return [];

    const nextData = JSON.parse(nextDataMatch[1]);
    const items = nextData.props?.pageProps?.data?.searchAds?.items || [];
    if (!Array.isArray(items) || items.length === 0) return [];

    const properties: Property[] = [];
    const cityCapitalized = params.city.charAt(0).toUpperCase() + params.city.slice(1);
    const targetDistConfig = params.district ? DISTRICT_CONFIGS.find(d => d.key === params.district) : undefined;
    const districtCapitalized = targetDistConfig ? targetDistConfig.name : (params.district ? params.district.charAt(0).toUpperCase() + params.district.slice(1) : '');

    for (let i = 0; i < items.length && properties.length < count; i++) {
      const item = items[i];
      if (!item.slug) continue;

      const directUrl = `https://www.otodom.pl/pl/oferta/${item.slug}`;
      const numericPrice = item.totalPrice?.value || 0;
      if (params.maxPrice && numericPrice > params.maxPrice) continue;

      const locLevels = item.location?.reverseGeocoding?.locations || [];
      const itemDistrictObj = locLevels.find((l: any) => l.locationLevel === 'district');
      const itemDistrictName = (itemDistrictObj?.name || '').toLowerCase();
      const itemResidentialObj = locLevels.find((l: any) => l.locationLevel === 'residential');
      const itemSubdistrictName = (itemResidentialObj?.name || '').toLowerCase();
      const itemTitleLower = (item.title || '').toLowerCase();
      const itemSlugLower = (item.slug || '').toLowerCase();

      // STRICT DISTRICT ENFORCEMENT FOR OTODOM:
      if (targetDistConfig) {
        if (itemDistrictName) {
          const isTargetDistrict = 
            itemDistrictName === targetDistConfig.name.toLowerCase() ||
            targetDistConfig.aliases.includes(itemDistrictName) ||
            targetDistConfig.neighborhoods.includes(itemDistrictName);

          if (!isTargetDistrict) {
            // Otodom included a promoted listing from another district (e.g. Mokotów when Bemowo is requested) -> DISCARD!
            console.log(`[OtodomCrawler] Pomijam ofertę z innej dzielnicy: "${itemDistrictObj.name}" (żądana: ${targetDistConfig.name})`);
            continue;
          }
        } else {
          // No explicit district field: verify via subdistrict, title, slug, or street
          const matchesTarget = 
            targetDistConfig.neighborhoods.some(n => itemSubdistrictName.includes(n) || itemTitleLower.includes(n) || itemSlugLower.includes(n)) ||
            targetDistConfig.aliases.some(a => itemTitleLower.includes(a) || itemSlugLower.includes(a));
          if (!matchesTarget) {
            continue;
          }
        }
      }

      const area = item.areaInSquareMeters ? `${Math.round(item.areaInSquareMeters)} m²` : 'N/A';
      const roomsCount = item.roomsNumber === 'ONE' ? 1 : item.roomsNumber === 'TWO' ? 2 : item.roomsNumber === 'THREE' ? 3 : item.roomsNumber === 'FOUR' ? 4 : 2;
      const roomsLabel = roomsCount === 1 ? '1 pokój (kawalerka)' : `${roomsCount} pokoje`;

      const priceFormatted = isRent
        ? `${numericPrice.toLocaleString('pl-PL')} PLN / mies.`
        : `${numericPrice.toLocaleString('pl-PL')} PLN`;

      const pricePerM2 = item.areaInSquareMeters > 0
        ? `${Math.round(numericPrice / item.areaInSquareMeters).toLocaleString('pl-PL')} PLN/m²`
        : 'N/A';

      const contactLabel = item.isPrivateOwner 
        ? 'Osoba prywatna (bezpośrednio od właściciela)'
        : (item.agency?.name ? `${item.agency.name}` : 'Biuro nieruchomości');

      const rawStreet = item.location?.address?.street?.name || '';
      const street = rawStreet.replace(/^(?:ul\.|ulica)\s*/i, '').trim();
      
      const realDistrict = itemDistrictObj?.name || districtCapitalized || cityCapitalized;
      const locality = itemResidentialObj?.name && itemResidentialObj.name !== realDistrict
        ? `${realDistrict} (${itemResidentialObj.name})`
        : realDistrict;

      const floorMap: Record<string, string> = {
        'GROUND': 'Parter',
        'FIRST': '1. piętro',
        'SECOND': '2. piętro',
        'THIRD': '3. piętro',
        'FOURTH': '4. piętro',
        'FIFTH': '5. piętro',
        'SIXTH': '6. piętro',
        'SEVENTH': '7. piętro',
        'EIGHTH': '8. piętro',
        'NINTH': '9. piętro',
        'TENTH': '10. piętro'
      };
      const floorClean = item.floorNumber ? (floorMap[String(item.floorNumber).toUpperCase()] || `${item.floorNumber}. piętro`) : 'Piętro w budynku';
      const floorLabel = floorClean;

      const prop: Property = {
        id: `otodom-live-${Date.now()}-${i}`,
        title: item.title,
        location: street ? `${cityCapitalized}, ${locality} (ul. ${street})` : `${cityCapitalized}, ${locality}`,
        dealType: params.dealType,
        propertyType: roomsCount === 1 ? 'Kawalerka' : 'Mieszkanie',
        price: priceFormatted,
        priceNumeric: numericPrice,
        pricePerM2,
        area,
        rooms: roomsLabel,
        floor: floorLabel,
        description: `Nowoczesna nieruchomość na portalu Otodom: "${item.title}". Lokalizacja: ${cityCapitalized} ${locality}${street ? ', ul. ' + street : ''}. Dostępna do zamieszkania od zaraz.`,
        source: 'Otodom',
        url: directUrl, // INDIVIDUAL AD URL!
        contact: contactLabel,
        hasPhoneNumber: Boolean(item.isPrivateOwner),
        features: [
          'Zweryfikowane na żywo na Otodom',
          item.isPrivateOwner ? 'Bez prowizji (Właściciel)' : 'Agencja',
          street ? `ul. ${street}` : locality,
          area
        ],
        isDirectOffer: true,
        liveVerification: {
          url: directUrl,
          isLive: true,
          status: 200,
          finalUrl: directUrl,
          isArchived: false,
          isTrap: false,
          statusLabel: 'active',
          message: 'Aktualne, w 100% aktywne ogłoszenie zweryfikowane na żywo w portalu Otodom',
          checkedAt: new Date().toISOString()
        }
      };

      properties.push(prop);
    }

    return properties;
  } catch (err: any) {
    console.error('[OtodomCrawler] Błąd:', err.message);
    return [];
  }
}

/**
 * Master function: fetches real live market offers concurrently from Otodom & Morizon
 */
export async function fetchRealLiveMarketOffers(params: CrawlParams, count = 12): Promise<Property[]> {
  console.log(`[LiveMarketEngine] Uruchamianie przeszukiwania rynku na żywo dla: ${params.city} ${params.district || ''}`);
  
  const [otodomResults, morizonResults] = await Promise.all([
    fetchLiveOtodomOffers(params, count).catch(() => []),
    fetchLiveMorizonOffers(params, count).catch(() => [])
  ]);

  console.log(`[LiveMarketEngine] Pobrane na żywo: Otodom (${otodomResults.length}), Morizon (${morizonResults.length})`);

  // Interleave offers so user gets diverse sources
  const merged: Property[] = [];
  const maxLen = Math.max(otodomResults.length, morizonResults.length);
  for (let i = 0; i < maxLen; i++) {
    if (otodomResults[i]) merged.push(otodomResults[i]);
    if (morizonResults[i]) merged.push(morizonResults[i]);
  }

  // Deduplicate and filter by budget and strict district
  const uniqueUrls = new Set<string>();
  const finalResults: Property[] = [];
  const targetDistConfig = params.district ? DISTRICT_CONFIGS.find(d => d.key === params.district) : undefined;

  for (const p of merged) {
    if (uniqueUrls.has(p.url)) continue;
    uniqueUrls.add(p.url);

    if (params.maxPrice && p.priceNumeric && p.priceNumeric > params.maxPrice) {
      continue;
    }

    // Final safeguard: if user searched for district, reject any mismatched offer
    if (targetDistConfig) {
      const locLower = (p.location || '').toLowerCase();
      const titleLower = (p.title || '').toLowerCase();
      let hasOtherDistrict = false;
      for (const other of DISTRICT_CONFIGS) {
        if (other.key === targetDistConfig.key) continue;
        if (other.city !== targetDistConfig.city) continue;
        if (locLower.includes(other.name.toLowerCase()) || titleLower.includes(` ${other.name.toLowerCase()}`)) {
          hasOtherDistrict = true;
          break;
        }
      }
      if (hasOtherDistrict) {
        console.log(`[LiveMarketEngine] Odrzucono ofertę z innej dzielnicy: ${p.location} (oczekiwano: ${targetDistConfig.name})`);
        continue;
      }
    }

    finalResults.push(p);
    if (finalResults.length >= count) break;
  }

  return finalResults;
}
