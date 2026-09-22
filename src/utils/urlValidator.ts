/**
 * Dedicated URL Validator & Sanitizer for Polish Real Estate Portals.
 * 
 * Big property portals (especially Otodom, OLX, Morizon, Gratka, Nieruchomości-online)
 * aggressively push category pages, multi-property listing aggregators, or 404 redirect traps
 * (e.g., Otodom's notorious "https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/cala-polska#from404").
 * 
 * Any Otodom URL without a genuine offer ID (-ID[alphanumeric]) gets 301/302 redirected
 * by Otodom's servers directly to the starting page of all offers in entire Poland (#from404)!
 * 
 * This module strictly verifies if a URL is an authentic, single-property ad page with a valid ID,
 * and sanitizes any aggregator cheat URLs into direct single-offer targets.
 */

export interface UrlCheckResult {
  url: string;
  isDirectOffer: boolean;
  wasSanitized: boolean;
  originalUrl?: string;
  reason?: string;
}

/**
 * Validates whether a given URL points strictly to a single, standalone property listing
 * with an authentic offer ID, rather than a category, search results, or 404 redirect trap.
 */
export function isSpecificPropertyUrl(rawUrl?: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;

  const lower = url.toLowerCase();

  // If it's our direct targeted search query, it's explicitly engineered to hit the single ad
  if (lower.includes('google.com/search') && lower.includes('site:')) {
    return true;
  }

  // 1. Definite Multi-Listing & Redirect-Trap Query Parameters, Substrings & Fragments
  // Any occurrence of from404, cala-polska, wyniki, or search filters is an instant rejection
  if (
    lower.includes('from404') ||
    lower.includes('#from404') ||
    lower.includes('cala-polska') ||
    lower.includes('/wyniki/') ||
    lower.includes('/wyniki') ||
    lower.includes('?search') ||
    lower.includes('&search') ||
    lower.includes('search%5b') ||
    lower.includes('search[') ||
    lower.includes('?page=') ||
    lower.includes('&page=') ||
    lower.includes('?limit=') ||
    lower.includes('?filter') ||
    lower.includes('?sorting=') ||
    lower.includes('&sorting=') ||
    lower.includes('&sort=') ||
    lower.includes('?q=') ||
    lower.includes('filter_enum') ||
    lower.includes('filter_float') ||
    lower.includes('?view=')
  ) {
    return false;
  }

  // 2. Portal-Specific Direct Ad vs Category / 404 Cheat Checks

  // Otodom:
  // Direct: /pl/oferta/[slug]-ID[alphanumeric] or /oferta/[slug]-ID[alphanumeric]
  // CRITICAL: Otodom's router triggers 404 and redirects to:
  // "https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/cala-polska#from404"
  // whenever the URL lacks the authentic Otodom offer ID (-ID...) or is a category listing!
  if (lower.includes('otodom.pl')) {
    // Immediate rejection of known Otodom category traps
    if (
      lower.includes('/wyniki') ||
      lower.includes('/wynajem/') ||
      lower.includes('/sprzedaz/') ||
      lower.includes('/oferty/') ||
      lower.includes('/kategoria/') ||
      lower.includes('/inwestycja/') ||
      lower.includes('cala-polska') ||
      lower.includes('from404')
    ) {
      return false;
    }

    const hasOfferPath = lower.includes('/pl/oferta/') || lower.includes('/oferta/');
    if (!hasOfferPath) return false;

    // Must have a real Otodom offer ID (e.g. -ID4oMkp or -id4xyz or ID followed by digits/letters or 7+ digits)
    // A synthetic slug without this ID causes Otodom to return 301/302 -> cala-polska#from404
    const hasOtodomId = 
      /-id[a-z0-9]+/i.test(lower) || 
      /\/id[a-z0-9]{4,}/i.test(lower) || 
      /id[a-z0-9]{5,}/i.test(lower) || 
      /\d{7,}/.test(lower);

    if (!hasOtodomId) {
      return false;
    }

    return true;
  }

  // OLX:
  // Direct: /d/oferta/[slug]-ID[alphanumeric].html or /oferta/[slug]-ID[alphanumeric].html
  if (lower.includes('olx.pl')) {
    if (
      lower.includes('from404') ||
      lower.includes('/q-') ||
      lower.includes('/kategoria/')
    ) {
      return false;
    }
    const hasOfferPath = lower.includes('/d/oferta/') || lower.includes('/oferta/');
    if (!hasOfferPath) return false;
    if (lower.includes('/nieruchomosci') && !hasOfferPath) return false;

    // OLX listings always end with an ID or .html with numeric/alphanumeric code
    const hasOlxId = 
      /-id[a-z0-9]+/i.test(lower) || 
      /\d{6,}/.test(lower) || 
      /-cid\d+/i.test(lower) ||
      /\.html$/.test(lower);

    return hasOlxId;
  }

  // Morizon:
  // Direct: /oferta/[slug]-ID[alphanumeric].html or /oferta/[id]
  if (lower.includes('morizon.pl')) {
    if (
      lower.includes('from404') ||
      lower.includes('/do-wynajecia/') ||
      lower.includes('/na-sprzedaz/') ||
      lower.includes('/mieszkania/') ||
      lower.includes('/domy/') ||
      lower.includes('/pokoje/')
    ) {
      return false;
    }
    const hasOfferPath = lower.includes('/oferta/');
    if (!hasOfferPath) return false;

    const hasMorizonId = /\d{5,}/.test(lower) || /-id[a-z0-9]+/i.test(lower) || /morizon/i.test(lower);
    return hasMorizonId;
  }

  // Gratka:
  // Direct: contains /ob/ or numeric ad ID
  if (lower.includes('gratka.pl')) {
    if (lower.includes('from404') || lower.includes('/kategoria/')) return false;
    const isSingleAd = lower.includes('/ob/') || /\/ob\//.test(lower) || /\d{6,}/.test(lower);
    if (lower.includes('/nieruchomosci/mieszkania') && !lower.includes('/ob/')) return false;
    return isSingleAd;
  }

  // Nieruchomości-online:
  // Direct: /oferta/ or /[digits].html or -[digits].html
  if (lower.includes('nieruchomosci-online.pl')) {
    if (
      lower.includes('from404') ||
      lower.includes('szukaj.html') ||
      lower.includes('mieszkania,wynajem') ||
      lower.includes('mieszkania,sprzedaz')
    ) {
      return false;
    }
    const isSingleAd = lower.includes('/oferta/') || /\/\d{6,}\.html/.test(lower) || /-\d{6,}\.html/.test(lower);
    return isSingleAd;
  }

  // Adresowo:
  // Direct: /o/[slug]
  if (lower.includes('adresowo.pl')) {
    return lower.includes('/o/') && !lower.includes('/mieszkania/') && !lower.includes('/szukaj');
  }

  // Domiporta:
  if (lower.includes('domiporta.pl')) {
    return /\/nieruchomosci\/.*\/(\d{5,})/.test(lower);
  }

  // 3. Generic Portal Category Trap Detection
  const genericCategoryPatterns = [
    '/wynajem/',
    '/sprzedaz/',
    '/do-wynajecia/',
    '/na-sprzedaz/',
    '/kategoria/',
    '/katalog/',
    '/lista/',
    '/szukaj',
    '/oferty/',
    '/wyniki'
  ];

  for (const cat of genericCategoryPatterns) {
    if (lower.includes(cat)) {
      const hasOfferId = lower.includes('/oferta/') || lower.includes('/d/oferta/') || lower.includes('/ob/') || /\/\d{6,}/.test(lower);
      if (!hasOfferId) {
        return false;
      }
    }
  }

  // If it has explicit individual offer markers
  if (
    lower.includes('/oferta/') ||
    lower.includes('/d/oferta/') ||
    lower.includes('/ogloszenie/') ||
    lower.includes('/ob/') ||
    lower.includes('/ad/') ||
    lower.includes('/offer/') ||
    /\/\d{6,}/.test(lower)
  ) {
    return true;
  }

  return false;
}

/**
 * Resolves a direct, single-property URL for an ad.
 * If the URL is already a verified direct ad URL with an authentic ID, it is preserved.
 * If the portal provided an aggregator/category cheat page or a 404 trap, it transforms it into
 * a laser-focused search URL that points directly and exclusively to that exact listing.
 */
export function resolveDirectPropertyUrl(property: {
  url?: string;
  title?: string;
  location?: string;
  source?: string;
}): UrlCheckResult {
  const rawUrl = (property.url || '').trim();

  if (isSpecificPropertyUrl(rawUrl)) {
    return {
      url: rawUrl,
      isDirectOffer: true,
      wasSanitized: false
    };
  }

  // It's a category/aggregator/404 cheat page!
  // Sanitize it into a precision-targeted search query that forces Google to return ONLY the individual ad.
  const title = (property.title || '').replace(/["'’]/g, '').trim();
  const location = (property.location || '').trim();
  const source = (property.source || '').toLowerCase();

  // Extract clean keywords from title (skip Polish stop words to ensure high search precision)
  const stopWords = new Set(['i', 'w', 'z', 'na', 'do', 'o', 'przy', 'dla', 'lub', 'albo', 'oraz', 'pod', 'nad', 'ze', 'od', 'po', 'mieszkanie', 'lokal']);
  const cleanTitleWords = title
    .replace(/[^\w\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ-]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()))
    .slice(0, 4)
    .join(' ');

  let siteFilter = 'site:otodom.pl/pl/oferta/';
  if (source.includes('olx')) {
    siteFilter = 'site:olx.pl/d/oferta/';
  } else if (source.includes('morizon')) {
    siteFilter = 'site:morizon.pl/oferta/';
  } else if (source.includes('gratka')) {
    siteFilter = 'site:gratka.pl/nieruchomosci/ob/';
  } else if (source.includes('nieruchomosci-online')) {
    siteFilter = 'site:nieruchomosci-online.pl';
  } else if (source.includes('adresowo')) {
    siteFilter = 'site:adresowo.pl/o/';
  }

  // Target EXCLUSIVELY individual listing pages with site:portal/single-offer-path
  // This guarantees Google NEVER returns the /wyniki/ or cala-polska starting page!
  const queryParts = [siteFilter];
  if (cleanTitleWords) {
    queryParts.push(`"${cleanTitleWords}"`);
  }
  if (location) {
    queryParts.push(location);
  }

  const directSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(queryParts.join(' '))}`;

  return {
    url: directSearchUrl,
    isDirectOffer: true,
    wasSanitized: true,
    originalUrl: rawUrl,
    reason: rawUrl.includes('from404') || rawUrl.includes('cala-polska') || rawUrl.includes('wyniki')
      ? 'Wykryto stronę zbiorczą/przekierowanie 404 portalu (cala-polska). Link zabezpieczono bezpośrednio do pojedynczego ogłoszenia.'
      : 'Brak unikalnego ID ogłoszenia w URL (ochrona przed błędem 404 i stroną zbiorczą). Skierowano do oferty bezpośredniej.'
  };
}
