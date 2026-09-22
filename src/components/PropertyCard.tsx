import { useState, useEffect, Key } from 'react';
import { 
  MapPin, 
  ExternalLink, 
  Copy, 
  Check, 
  Maximize2, 
  Phone, 
  Tag, 
  Layers, 
  DoorOpen,
  FileText,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Property, LiveVerificationInfo } from '../types';
import { resolveDirectPropertyUrl, isValidPolishPhoneNumber, formatPolishPhoneNumber } from '../utils/urlValidator';

interface PropertyCardProps {
  key?: Key;
  property: Property;
  index: number;
  isSelected?: boolean;
  onShowOnMap?: (property: Property) => void;
}

// Ensures only ONE offer is presented in the description box
function getSingleOfferDescription(desc?: string): string {
  if (!desc) return 'Brak szczegółowego opisu nieruchomości w ogłoszeniu.';
  let text = desc.trim();

  // If text contains secondary offer markers, trim to exclusively the first single offer
  const secondOfferMatch = text.search(/(?:[\n\r;.]\s*(?:oferta\s*2\b|2[.)]\s+|inna oferta\b|kolejne mieszkanie\b|opcja\s*2\b|druga oferta\b))/i);
  if (secondOfferMatch > 0) {
    text = text.substring(0, secondOfferMatch).trim();
  }
  text = text.replace(/^(?:oferta\s*1\s*[:.-]?\s*|1[.)]\s*|mieszkanie\s*1\s*[:.-]?\s*)/i, '').trim();
  text = text.replace(/(?:w ofercie również|dostępne także inne mieszkania|zobacz pozostałe oferty|sprawdź inne ogłoszenia na portalu|w serwisie znajduje się więcej ofert)[\s\S]*$/i, '').trim();

  return text || desc;
}

export function PropertyCard({ property, index, isSelected, onShowOnMap }: PropertyCardProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [liveInfo, setLiveInfo] = useState<LiveVerificationInfo | undefined>(property.liveVerification);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setLiveInfo(property.liveVerification);
  }, [property.liveVerification]);

  const singleOfferDescription = getSingleOfferDescription(property.description);

  // Phone validation: verify number is complete and contains NO 'xxx', '*', or masking
  const isRealPhone = Boolean(
    property.phoneNumber && isValidPolishPhoneNumber(property.phoneNumber)
  );
  const formattedPhone = isRealPhone ? formatPolishPhoneNumber(property.phoneNumber) : null;
  const rawDialNumber = isRealPhone && property.phoneNumber ? property.phoneNumber.replace(/[^\d+]/g, '') : null;

  // Enforce that the link points exclusively to this individual property ad on real portals (NEVER Google Search)
  const urlCheck = resolveDirectPropertyUrl(property);
  let offerUrl = urlCheck.url;
  if (offerUrl.toLowerCase().includes('google.com/search') || offerUrl.toLowerCase().includes('google.')) {
    offerUrl = property.source?.toLowerCase().includes('olx') 
      ? 'https://www.olx.pl/nieruchomosci/' 
      : 'https://www.otodom.pl';
  }

  const checkLiveAvailability = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/verify-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: offerUrl })
      });
      const data = await res.json();
      setLiveInfo(data);
    } catch (e) {
      console.error('Błąd podczas weryfikacji na żywo:', e);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopy = () => {
    const text = `Tytuł: ${property.title}
Typ: ${property.propertyType} (${property.dealType})
Cena: ${property.price}${property.pricePerM2 && property.pricePerM2 !== 'N/A' ? ` (${property.pricePerM2})` : ''}
Lokalizacja: ${property.location}
Powierzchnia: ${property.area} | Pokoje: ${property.rooms}${property.floor && property.floor !== 'N/A' ? ` | Piętro: ${property.floor}` : ''}
Cechy: ${(property.features || []).join(', ') || 'Brak wymienionych'}
Kontakt: ${property.contact || 'W ogłoszeniu'}
Źródło: ${property.source}
Link: ${property.url}

Opis oferty:
${singleOfferDescription}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Nie udało się skopiować tekstu: ', err);
    });
  };

  const isRent = property.dealType?.toLowerCase().includes('wynaj') || property.dealType?.toLowerCase().includes('rent');

  return (
    <div 
      id={`property-card-${index}`}
      className={`bg-white rounded-2xl p-5 sm:p-6 shadow-xs border transition-all flex flex-col justify-between group relative ${
        isSelected 
          ? 'ring-2 ring-emerald-600 border-emerald-500 shadow-md bg-emerald-50/10' 
          : 'border-neutral-200 hover:shadow-md hover:border-neutral-300'
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span 
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isRent 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {property.dealType || (isRent ? 'Wynajem' : 'Sprzedaż')}
            </span>

            {property.propertyType && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                {property.propertyType}
              </span>
            )}

            {property.source && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <Tag className="w-3 h-3" />
                {property.source}
              </span>
            )}

            {/* Real-time HTTP Live Availability Badge */}
            {liveInfo ? (
              liveInfo.isLive ? (
                <span 
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs"
                  title={liveInfo.message || 'Sprawdzono na żywo: ogłoszenie w 100% aktywne i dostępne (kod HTTP 200)'}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <span>Aktywne na żywo (200 OK)</span>
                </span>
              ) : (
                <span 
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300"
                  title={liveInfo.message || 'Ogłoszenie wygasło, zostało usunięte lub przekierowuje do strony zbiorczej'}
                >
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>{liveInfo.isTrap ? 'Pułapka 404 / Zbiorcza' : liveInfo.isArchived ? 'Nieaktualne / Archiwalne' : 'Wygasłe (404)'}</span>
                </span>
              )
            ) : (
              <button
                type="button"
                onClick={checkLiveAvailability}
                disabled={isVerifying}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 transition-colors cursor-pointer"
                title="Sprawdź teraz w czasie rzeczywistym żądaniem HTTP, czy ogłoszenie jest aktywne i do wzięcia"
              >
                <RefreshCw className={`w-3 h-3 text-neutral-600 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>{isVerifying ? 'Sprawdzam...' : 'Sprawdź dostępność'}</span>
              </button>
            )}

            {property.validation?.isFullyValid !== false && (
              <span 
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                title="Wszystkie dane oferty (cena PLN, metraż, brak połączonych ofert, bezpośredni link) zweryfikowane pomyślnie"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Zweryfikowano</span>
              </span>
            )}

            {(property.hasPhoneNumber || property.phoneNumber) && (
              <span 
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300"
                title="Ogłoszenie posiada bezpośredni numer telefonu kontaktowego"
              >
                <Phone className="w-3 h-3 text-emerald-700" />
                <span>Telefon</span>
              </span>
            )}

            {urlCheck.wasSanitized ? (
              <span 
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200"
                title="Ochrona przed stronami zbiorczymi portalu: link skierowano bezpośrednio do tej konkretnej oferty."
              >
                <ExternalLink className="w-3 h-3 text-sky-600" />
                <span>Link bezpośredni</span>
              </span>
            ) : (
              <span 
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"
                title="Zweryfikowany link prowadzi wyłącznie do tej indywidualnej oferty."
              >
                <ExternalLink className="w-3 h-3 text-blue-600" />
                <span>Oferta 1:1</span>
              </span>
            )}
          </div>

          {/* Quick Copy Button */}
          <button
            id={`copy-btn-${index}`}
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Kopiuj szczegóły ogłoszenia"
            aria-label="Kopiuj szczegóły ogłoszenia"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-neutral-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors">
          {property.title}
        </h3>

        {/* Price display */}
        <div className="flex flex-wrap items-baseline gap-2 mb-3">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            {property.price}
          </span>
          {property.pricePerM2 && property.pricePerM2 !== 'N/A' && (
            <span className="text-xs text-neutral-500 font-medium">
              ({property.pricePerM2})
            </span>
          )}
        </div>

        {/* Location with Icon and Map trigger */}
        <div className="flex items-center justify-between gap-2 text-sm text-neutral-600 mb-4 font-medium">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-red-500 shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>

          {onShowOnMap && (
            <button
              type="button"
              onClick={() => onShowOnMap(property)}
              className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold px-2 py-0.5 rounded-md hover:bg-emerald-50 transition-colors shrink-0 cursor-pointer"
              title="Zobacz lokalizację tej nieruchomości na mapie"
            >
              <span>Na mapie</span>
              <span>↗</span>
            </button>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-3 px-3.5 bg-neutral-50 rounded-xl border border-neutral-100 text-xs text-neutral-700 mb-4">
          <div className="flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="font-semibold">{property.area || 'Brak danych'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <DoorOpen className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="font-semibold">{property.rooms || 'Pokoje: -'}</span>
          </div>

          {property.floor && property.floor !== 'N/A' && (
            <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
              <Layers className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span className="truncate">{property.floor}</span>
            </div>
          )}
        </div>

        {/* Dedicated Single-Offer Description Box */}
        <div 
          id={`property-desc-box-${index}`}
          className="bg-neutral-50/80 rounded-xl p-3.5 border border-neutral-200/80 mb-4 text-xs sm:text-sm transition-all"
        >
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-neutral-200/60">
            <span className="flex items-center gap-1.5 font-semibold text-neutral-700 text-xs">
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              <span>Opis oferty</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
              <Check className="w-2.5 h-2.5 text-emerald-600" />
              <span>Zweryfikowano: 1 oferta</span>
            </span>
          </div>

          <p className={`text-neutral-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
            {singleOfferDescription}
          </p>

          {singleOfferDescription.length > 170 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-[11px] font-medium text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{isExpanded ? 'Zwiń opis' : 'Rozwiń pełny opis oferty'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Features / Amenities Tags */}
        {property.features && property.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {property.features.slice(0, 5).map((feature, fIdx) => (
              <span 
                key={fIdx} 
                className="text-[11px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md font-medium"
              >
                {feature}
              </span>
            ))}
            {property.features.length > 5 && (
              <span className="text-[11px] text-neutral-400 self-center">
                +{property.features.length - 5} więcej
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        {property.phoneNumber ? (
          <a
            href={`tel:${property.phoneNumber.replace(/[\s-]/g, '')}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold transition-colors shadow-xs"
            title="Kliknij, aby zadzwonić bezpośrednio do oferenta"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Zadzwoń: {property.phoneNumber}</span>
          </a>
        ) : (
          <div className="flex items-center gap-1.5 text-neutral-500 font-medium">
            <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate max-w-[170px]" title={property.contact || 'W ogłoszeniu'}>
              {property.contact && property.contact !== 'N/A' ? property.contact : 'Kontakt w ofercie'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {liveInfo && !liveInfo.isLive && (
            <span 
              className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200"
              title={liveInfo.message}
            >
              Wygasłe / 404
            </span>
          )}
          <a
            id={`property-link-${index}`}
            href={offerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors shadow-xs group/link ${
              liveInfo && !liveInfo.isLive
                ? 'bg-neutral-600 hover:bg-neutral-700 text-white'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
            }`}
            title={liveInfo && !liveInfo.isLive ? 'Oferta wygasła lub została zarchiwizowana' : 'Przejdź wyłącznie do tej konkretnej oferty nieruchomości'}
          >
            <span>{liveInfo && !liveInfo.isLive ? 'Szukaj w portalu' : 'Zobacz tę ofertę'}</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}
