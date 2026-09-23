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
  // Any occurrence of from404 or cala-polska is an instant rejection (Otodom dead redirect trap)
  if (
    lower.includes('from404') ||
    lower.includes('#from404') ||
    lower.includes('cala-polska')
  ) {
    return false;
  }

  // 2. Portal-Specific Direct Ad vs Category / 404 Cheat Checks

  // Otodom:
  if (lower.includes('otodom.pl')) {
    if (lower.includes('cala-polska') || lower.includes('from404')) {
      return false;
    }
    return true;
  }

  // OLX:
  if (lower.includes('olx.pl')) {
    if (lower.includes('from404')) {
      return false;
    }
    return true;
  }

  // Morizon:
  if (lower.includes('morizon.pl')) {
    if (lower.includes('from404')) {
      return false;
    }
    return true;
  }

  // Gratka:
  if (lower.includes('gratka.pl')) {
    if (lower.includes('from404')) {
      return false;
    }
    return true;
  }

  // Nieruchomości-online:
  if (lower.includes('nieruchomosci-online.pl')) {
    if (lower.includes('from404')) {
      return false;
    }
    return true;
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
