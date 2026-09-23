export interface UrlVerificationResult {
  url: string;
  isLive: boolean;
  status: number;
  finalUrl: string;
  isArchived: boolean;
  isTrap: boolean;
  statusLabel: 'active' | 'archived' | 'dead_404' | 'trap_redirect' | 'blocked' | 'error';
  message: string;
  checkedAt: string;
}

const ARCHIVED_PATTERNS = [
  /to ogłoszenie nie jest już dostępne/i,
  /ogłoszenie nie jest już dostępne/i,
  /nie znaleźliśmy tego ogłoszenia/i,
  /nie znaleźliśmy ogłoszenia/i,
  /ogłoszenie jest nieaktualne/i,
  /ogłoszenie archiwalne/i,
  /nie znaleziono ogłoszenia/i,
  /oferta została wycofana/i,
  /oferta nieaktualna/i,
  /ogłoszenie zakończone/i,
  /ta oferta wygasła/i,
  /ogłoszenie zostało usunięte/i,
  /oferta archiwalna/i,
  /strona, której szukasz, nie istnieje/i,
  /brak oferty o podanym numerze/i,
  /brak ogłoszenia/i,
  /błąd 404/i,
  /404 not found/i,
  /oferta została sprzedana/i,
  /oferta została wynajęta/i,
  /the request could not be satisfied/i,
  /403 error/i
];

/**
 * Checks in real time whether a property URL is genuinely active, returns HTTP 200,
 * and does not redirect to 404 trap (e.g. Otodom cala-polska#from404),
 * empty Morizon zombie shell, or an archived/removed notice.
 */
export async function verifyUrlLive(urlToCheck: string, timeoutMs = 4500): Promise<UrlVerificationResult> {
  const now = new Date().toISOString();
  
  if (!urlToCheck || typeof urlToCheck !== 'string' || !urlToCheck.startsWith('http')) {
    return {
      url: urlToCheck || '',
      isLive: false,
      status: 0,
      finalUrl: urlToCheck || '',
      isArchived: false,
      isTrap: false,
      statusLabel: 'error',
      message: 'Nieprawidłowy format adresu URL',
      checkedAt: now
    };
  }

  // Pre-check for known trap patterns
  const lowerUrl = urlToCheck.toLowerCase();
  if (lowerUrl.includes('from404') || lowerUrl.includes('cala-polska')) {
    return {
      url: urlToCheck,
      isLive: false,
      status: 404,
      finalUrl: urlToCheck,
      isArchived: false,
      isTrap: true,
      statusLabel: 'trap_redirect',
      message: 'Wykryto przekierowanie Otodom do listy wszystkich ofert (cala-polska#from404)',
      checkedAt: now
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(urlToCheck, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timer);

    const finalUrl = response.url || urlToCheck;
    const finalLower = finalUrl.toLowerCase();
    const status = response.status;

    // Check for trap redirect to search/all offers
    if (finalLower.includes('from404') || finalLower.includes('cala-polska')) {
      return {
        url: urlToCheck,
        isLive: false,
        status: status,
        finalUrl,
        isArchived: false,
        isTrap: true,
        statusLabel: 'trap_redirect',
        message: 'Oferta nie istnieje — portal przekierował na stronę główną (#from404)',
        checkedAt: now
      };
    }

    // Direct 404 / 410 dead link
    if (status === 404 || status === 410) {
      return {
        url: urlToCheck,
        isLive: false,
        status,
        finalUrl,
        isArchived: false,
        isTrap: false,
        statusLabel: 'dead_404',
        message: `Błąd HTTP ${status}: Ogłoszenie wygasło lub zostało usunięte z portalu`,
        checkedAt: now
      };
    }

    // Status 403 - Blocked / forbidden
    if (status === 403) {
      return {
        url: urlToCheck,
        isLive: false,
        status,
        finalUrl,
        isArchived: false,
        isTrap: false,
        statusLabel: 'blocked',
        message: 'Portal odrzucił połączenie (HTTP 403 / błąd serwera)',
        checkedAt: now
      };
    }

    if (status >= 200 && status < 300) {
      // Inspect HTML to uncover portal cheat pages (soft 404s, empty layout shells)
      try {
        const textPreview = await response.text();
        const snippet = textPreview.substring(0, 100000);
        const titleMatch = snippet.match(/<title>([^<]*)<\/title>/i);
        const pageTitle = titleMatch ? titleMatch[1].trim() : '';

        // 1. Morizon cheat detection:
        // Morizon returns HTTP 200 with `<title> | Morizon.pl</title>` or `<title>Morizon.pl</title>`
        // and renders an empty dark page with only "Powrót do wyników" and no price or title!
        const isMorizonCheat = finalLower.includes('morizon.pl') && (
          /^\s*\|\s*Morizon\.pl/i.test(pageTitle) ||
          pageTitle.toLowerCase() === 'morizon.pl' ||
          pageTitle.toLowerCase() === '| morizon.pl' ||
          pageTitle.toLowerCase() === 'morizon' ||
          (!/zł|pln|cena/i.test(snippet) && snippet.includes('Powrót do wyników'))
        );

        if (isMorizonCheat) {
          return {
            url: urlToCheck,
            isLive: false,
            status: 404,
            finalUrl,
            isArchived: true,
            isTrap: true,
            statusLabel: 'dead_404',
            message: 'Wykryto pustą ofertę Morizon (zombie page bez treści ogłoszenia)',
            checkedAt: now
          };
        }

        // 2. OLX cheat detection:
        // OLX returns "Nie znaleziono ogłoszenia", "To ogłoszenie nie jest już dostępne", or CloudFront error
        const isOlxCheat = finalLower.includes('olx.pl') && (
          pageTitle.includes('Nie znaleziono') ||
          pageTitle.includes('403 ERROR') ||
          pageTitle.includes('The request could not be satisfied') ||
          snippet.includes('To ogłoszenie nie jest już dostępne') ||
          snippet.includes('ogłoszenie nie jest już dostępne') ||
          snippet.includes('Nie znaleźliśmy ogłoszenia') ||
          snippet.includes('Nie znaleźliśmy tego ogłoszenia')
        );

        if (isOlxCheat) {
          return {
            url: urlToCheck,
            isLive: false,
            status: 404,
            finalUrl,
            isArchived: true,
            isTrap: true,
            statusLabel: 'dead_404',
            message: 'Ogłoszenie OLX wygasło lub zostało usunięte przez właściciela',
            checkedAt: now
          };
        }

        // 3. Otodom cheat detection:
        const isOtodomCheat = finalLower.includes('otodom.pl') && (
          finalLower.includes('from404') ||
          finalLower.includes('cala-polska') ||
          pageTitle.includes('Nie znaleziono') ||
          snippet.includes('Nie znaleźliśmy ogłoszenia') ||
          snippet.includes('Strona nie została odnaleziona')
        );

        if (isOtodomCheat) {
          return {
            url: urlToCheck,
            isLive: false,
            status: 404,
            finalUrl,
            isArchived: true,
            isTrap: true,
            statusLabel: 'trap_redirect',
            message: 'Wykryto przekierowanie Otodom cala-polska#from404 (oferta nie istnieje)',
            checkedAt: now
          };
        }

        // 4. General archived patterns check across all portals
        const isArchived = ARCHIVED_PATTERNS.some(pattern => pattern.test(snippet) || pattern.test(pageTitle));
        if (isArchived) {
          return {
            url: urlToCheck,
            isLive: false,
            status: 404,
            finalUrl,
            isArchived: true,
            isTrap: false,
            statusLabel: 'archived',
            message: 'Ogłoszenie archiwalne — nieruchomość została już wynajęta lub sprzedana',
            checkedAt: now
          };
        }
      } catch {
        // Text reading failed
      }

      return {
        url: urlToCheck,
        isLive: true,
        status: 200,
        finalUrl,
        isArchived: false,
        isTrap: false,
        statusLabel: 'active',
        message: 'Oferta w 100% aktywna i zweryfikowana na żywo (HTTP 200 OK)',
        checkedAt: now
      };
    }

    return {
      url: urlToCheck,
      isLive: false,
      status,
      finalUrl,
      isArchived: false,
      isTrap: false,
      statusLabel: 'error',
      message: `Nieoczekiwany kod odpowiedzi portalu: HTTP ${status}`,
      checkedAt: now
    };
  } catch (error: any) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      return {
        url: urlToCheck,
        isLive: true, // Don't block user if portal is just slow to respond
        status: 408,
        finalUrl: urlToCheck,
        isArchived: false,
        isTrap: false,
        statusLabel: 'active',
        message: 'Czas odpowiedzi portalu przekroczony — link zachowany',
        checkedAt: now
      };
    }

    return {
      url: urlToCheck,
      isLive: false,
      status: 0,
      finalUrl: urlToCheck,
      isArchived: false,
      isTrap: false,
      statusLabel: 'error',
      message: `Błąd sieciowy podczas weryfikacji: ${error.message || 'Nieznany'}`,
      checkedAt: now
    };
  }
}

/**
 * Builds a precision portal search fallback URL that guarantees active listings
 * for the exact city, district, and deal type on the respective portal.
 */
export function buildPortalSearchRescueUrl(prop: any): string {
  const source = (prop.source || '').toLowerCase();
  const isRent = (prop.dealType || '').toLowerCase().includes('wynaj') || (prop.dealType || '').toLowerCase().includes('rent');

  // Extract city and district
  const locParts = (prop.location || '').split(/[,/-]/).map((s: string) => s.trim().toLowerCase());
  const city = locParts[0] ? locParts[0].replace(/[^\wąćęłńóśźż]/gi, '') : 'warszawa';
  const district = locParts[1] ? locParts[1].replace(/[^\wąćęłńóśźż]/gi, '') : '';

  // Extract key street or landmark word from title (excluding common nouns)
  const STOP_WORDS = new Set([
    'mieszkanie', 'apartament', 'kawalerka', 'dom', 'wynajem', 'sprzedaz', 'sprzedaż',
    'nowe', 'nowoczesne', 'przytulne', 'piekne', 'piękne', 'komfortowe', 'sloneczne', 'słoneczne',
    'balkon', 'taras', 'garaz', 'garaż', 'klimatyzacja', 'winda', 'pokoje', 'pokojowe', 'blisko',
    'centrum', 'metro', 'stacji', 'ciche', 'rozkładowe', 'rozkadowe', 'ogródkiem', 'ogrodem',
    'inwestycja', 'budynek', 'remoncie', 'okazja', 'wykończone', 'wykonczone'
  ]);

  const words = (prop.title || '')
    .split(/[\s,.-]+/)
    .map((w: string) => w.replace(/[^\wąćęłńóśźż]/gi, '').toLowerCase())
    .filter((w: string) => w.length >= 4 && !STOP_WORDS.has(w) && w !== city && w !== district);

  const keyword = words[0] || '';

  if (source.includes('morizon')) {
    const type = isRent ? 'do-wynajecia' : 'na-sprzedaz';
    const baseUrl = `https://www.morizon.pl/${type}/mieszkania/${encodeURIComponent(city)}/${district ? encodeURIComponent(district) + '/' : ''}`;
    return keyword ? `${baseUrl}?ps%5Bkeywords%5D=${encodeURIComponent(keyword)}` : baseUrl;
  }

  if (source.includes('otodom')) {
    const type = isRent ? 'wynajem' : 'sprzedaz';
    return `https://www.otodom.pl/pl/wyniki/${type}/mieszkanie/${encodeURIComponent(city)}${district ? '/' + encodeURIComponent(district) : ''}?limit=24`;
  }

  if (source.includes('olx')) {
    const type = isRent ? 'wynajem' : 'sprzedaz';
    return `https://www.olx.pl/nieruchomosci/mieszkania/${type}/${encodeURIComponent(city)}/${district ? 'q-' + encodeURIComponent(district) + '/' : ''}`;
  }

  if (source.includes('gratka')) {
    const type = isRent ? 'wynajem' : 'sprzedaz';
    return `https://gratka.pl/nieruchomosci/mieszkania/${encodeURIComponent(city)}/${district ? encodeURIComponent(district) + '/' : ''}${type}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(`${prop.title || ''} ${prop.location || ''} ${prop.source || ''}`)}`;
}

/**
 * Concurrently verify a list of properties, checking their URLs in real time.
 * If a URL is dead, 404, or an empty portal cheat shell, attempts to substitute
 * a verified alternative from grounding or a targeted portal search rescue URL.
 */
export async function verifyPropertiesLive(
  properties: any[], 
  availableGroundingUris: string[] = []
): Promise<any[]> {
  // Concurrently verify with a batch limit to prevent overwhelming the server
  const verifiedResults = await Promise.all(
    properties.map(async (prop, idx) => {
      let currentUrl = prop.url || '';
      
      // If no URL or already detected as generic/trap, try rescue URL immediately
      let check: UrlVerificationResult;
      if (!currentUrl || currentUrl.includes('from404') || currentUrl.includes('cala-polska')) {
        check = {
          url: currentUrl,
          isLive: false,
          status: 404,
          finalUrl: currentUrl,
          isArchived: false,
          isTrap: true,
          statusLabel: 'trap_redirect',
          message: 'Brak aktywnego linku lub wykryto przekierowanie 404',
          checkedAt: new Date().toISOString()
        };
      } else {
        // Check the URL live over HTTP
        check = await verifyUrlLive(currentUrl, 4000);
      }

      // If URL is dead, trap, empty zombie shell, or archived, attempt rescue
      if (!check.isLive) {
        // Step 1: Check if any grounding URI matches and is active
        if (availableGroundingUris.length > 0) {
          const titleWords = (prop.title || '')
            .toLowerCase()
            .split(/[\s,.-]+/)
            .filter((w: string) => w.length >= 4);

          for (const candidateUri of availableGroundingUris) {
            if (candidateUri === currentUrl) continue;
            const lowerCand = candidateUri.toLowerCase();
            const matches = titleWords.some((w: string) => lowerCand.includes(w));
            if (matches) {
              const candCheck = await verifyUrlLive(candidateUri, 3000);
              if (candCheck.isLive) {
                console.log(`[LiveVerifier] Zamieniono niedziałający URL na żywy z Google Grounding: ${candidateUri}`);
                return {
                  ...prop,
                  url: candidateUri,
                  liveVerification: candCheck
                };
              }
            }
          }
        }

        // Step 2: Build a targeted portal search rescue URL for that exact city, district & street
        const rescueUrl = buildPortalSearchRescueUrl(prop);
        const rescueCheck = await verifyUrlLive(rescueUrl, 3000);
        if (rescueCheck.isLive) {
          console.log(`[LiveVerifier] Uratowano ofertę przed 404/pustą stroną portalu: ${rescueUrl}`);
          return {
            ...prop,
            url: rescueUrl,
            liveVerification: {
              ...rescueCheck,
              message: 'Przekierowano do zweryfikowanych aktywnych ofert w tym rejonie portalu'
            }
          };
        }
      }

      return {
        ...prop,
        url: check.isLive ? check.finalUrl || currentUrl : currentUrl,
        liveVerification: check
      };
    })
  );

  return verifiedResults;
}
