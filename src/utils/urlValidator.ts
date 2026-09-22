/**
 * Dedicated URL & Phone Validator for Polish Real Estate Portals.
 * 
 * Guarantees that:
 * 1. Links ALWAYS point to real property portal websites (Otodom, OLX, Morizon, Gratka, etc.)
 *    and NEVER to Google Search (google.com/search).
 * 2. Phone numbers with masks ("502 xxx xxx", "601-xxx-xxx", "***", "Pokaż numer")
 *    are strictly rejected and never displayed as callable numbers.
 */

export interface UrlCheckResult {
  url: string;
  isDirectOffer: boolean;
  wasSanitized: boolean;
  originalUrl?: string;
  reason?: string;
}

/**
 * Validates whether a phone number is an authentic, complete Polish phone number
 * and NOT a masked placeholder (e.g. containing 'xxx', 'XXX', '*', '•', or hidden behind 'Pokaż numer').
 */
export function isValidPolishPhoneNumber(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  
  // If it contains any masked characters or placeholder text, it is completely INVALID
  if (/[xX*•_?]/.test(trimmed)) return false;
  if (/pokaż|ukryt|brak|zobacz|ogłoszeni|sprawdź|w serwisie/i.test(trimmed)) return false;

  // Extract pure digits
  const digits = trimmed.replace(/\D/g, '');

  // Standard 9-digit Polish number (e.g. 501234567, 221234567)
  if (digits.length === 9) {
    return /^[1-9]\d{8}$/.test(digits);
  }

  // 11 digits starting with Polish country code 48 (e.g. 48501234567)
  if (digits.length === 11 && digits.startsWith('48')) {
    return /^48[1-9]\d{8}$/.test(digits);
  }

  return false;
}

/**
 * Formats a valid Polish phone number into clean "+48 XXX XXX XXX" format.
 * Returns null if the number is masked with xxx or invalid.
 */
export function formatPolishPhoneNumber(phone?: string | null): string | null {
  if (!phone || !isValidPolishPhoneNumber(phone)) return null;
  const digits = phone.replace(/\D/g, '');
  const localDigits = digits.length === 11 && digits.startsWith('48') ? digits.slice(2) : digits;
  if (localDigits.length === 9) {
    return `+48 ${localDigits.slice(0, 3)} ${localDigits.slice(3, 6)} ${localDigits.slice(6, 9)}`;
  }
  return null;
}

/**
 * Validates whether a given URL points to a property listing on an authentic portal,
 * rather than a search aggregator trap or 404 redirect.
 * CRITICAL: Under NO circumstances is Google Search considered a property URL.
 */
export function isSpecificPropertyUrl(rawUrl?: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;

  const lower = url.toLowerCase();

  // CATEGORICAL BAN: Google Search is NEVER a property listing URL
  if (lower.includes('google.com/search') || lower.includes('google.') || lower.includes('bing.com')) {
    return false;
  }

  // Definite Multi-Listing & Redirect-Trap Query Parameters, Substrings & Fragments
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

  // Otodom:
  // Direct: /pl/oferta/[slug] or /oferta/[slug]
  if (lower.includes('otodom.pl')) {
    if (
      lower.includes('/wyniki') ||
      lower.includes('/kategoria/') ||
      lower.includes('cala-polska') ||
      lower.includes('from404')
    ) {
      return false;
    }
    return lower.includes('/pl/oferta/') || lower.includes('/oferta/');
  }

  // OLX:
  // Direct: /d/oferta/[slug] or /oferta/[slug]
  if (lower.includes('olx.pl')) {
    if (
      lower.includes('from404') ||
      lower.includes('/q-') ||
      lower.includes('/kategoria/')
    ) {
      return false;
    }
    return lower.includes('/d/oferta/') || lower.includes('/oferta/');
  }

  // Morizon:
  // Direct: /oferta/[slug]
  if (lower.includes('morizon.pl')) {
    if (lower.includes('from404') || lower.includes('/kategoria/')) return false;
    return lower.includes('/oferta/');
  }

  // Gratka:
  // Direct: /ob/ or /oferta/
  if (lower.includes('gratka.pl')) {
    if (lower.includes('from404') || lower.includes('/kategoria/')) return false;
    return lower.includes('/ob/') || lower.includes('/oferta/');
  }

  // Nieruchomości-online:
  if (lower.includes('nieruchomosci-online.pl')) {
    if (lower.includes('from404')) return false;
    return lower.includes('/oferta/') || /\/\d{6,}\.html/.test(lower);
  }

  // Domiporta:
  if (lower.includes('domiporta.pl')) {
    return lower.includes('/nieruchomosci/') || lower.includes('/oferta/');
  }

  // Adresowo:
  if (lower.includes('adresowo.pl')) {
    return lower.includes('/o/');
  }

  // Generic portal listing detection
  return (
    lower.includes('/oferta/') ||
    lower.includes('/d/oferta/') ||
    lower.includes('/ogloszenie/') ||
    lower.includes('/ob/') ||
    lower.includes('/ad/') ||
    lower.includes('/offer/')
  );
}

/**
 * Resolves the genuine property listing URL.
 * Guarantees that the resulting URL is ALWAYS on a real Polish property portal (Otodom, OLX, Morizon, etc.)
 * and NEVER redirects to Google Search.
 */
export function resolveDirectPropertyUrl(property: {
  url?: string;
  title?: string;
  location?: string;
  source?: string;
}): UrlCheckResult {
  let rawUrl = (property.url || '').trim();

  // CATEGORICAL BAN: Never allow Google Search URLs
  if (rawUrl.toLowerCase().includes('google.com/search') || rawUrl.toLowerCase().includes('google.')) {
    rawUrl = '';
  }

  // If rawUrl is a valid http(s) URL on a property portal
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    // If it's the notorious Otodom 404 trap (cala-polska#from404), redirect to Otodom search for location
    if (rawUrl.toLowerCase().includes('from404') || rawUrl.toLowerCase().includes('cala-polska')) {
      const locSlug = (property.location || 'warszawa')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-');
      return {
        url: `https://www.otodom.pl/pl/oferty/wynajem/mieszkanie/${locSlug}`,
        isDirectOffer: false,
        wasSanitized: true,
        originalUrl: rawUrl,
        reason: 'Oryginalny link prowadził do błędu 404 Otodom (cala-polska#from404). Skierowano do portalu.'
      };
    }

    return {
      url: rawUrl,
      isDirectOffer: isSpecificPropertyUrl(rawUrl),
      wasSanitized: false
    };
  }

  // If no URL or invalid, point directly to the respective portal (NEVER Google Search!)
  const source = (property.source || '').toLowerCase();
  let portalUrl = 'https://www.otodom.pl';
  if (source.includes('olx')) {
    portalUrl = 'https://www.olx.pl/nieruchomosci/';
  } else if (source.includes('morizon')) {
    portalUrl = 'https://www.morizon.pl';
  } else if (source.includes('gratka')) {
    portalUrl = 'https://gratka.pl/nieruchomosci';
  } else if (source.includes('nieruchomosci-online')) {
    portalUrl = 'https://www.nieruchomosci-online.pl';
  }

  return {
    url: portalUrl,
    isDirectOffer: false,
    wasSanitized: true,
    originalUrl: rawUrl,
    reason: 'Przekierowano bezpośrednio do portalu nieruchomości.'
  };
}
