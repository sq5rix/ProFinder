import { useState, useMemo, FormEvent } from 'react';
import { 
  Search, 
  Loader2, 
  Copy, 
  Check, 
  Download, 
  FileText,
  SlidersHorizontal,
  Home,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Map,
  List,
  Columns
} from 'lucide-react';
import { Property, DealType, SearchHistoryItem, GroundingSource, SearchResponse, VerificationSummary } from './types';
import { SearchHeader } from './components/SearchHeader';
import { PropertyCard } from './components/PropertyCard';
import { PropertyMap } from './components/PropertyMap';
import { FilterPresets } from './components/FilterPresets';
import { RecentSearches } from './components/RecentSearches';
import { GroundingInfo } from './components/GroundingInfo';
import { DataVerificationBar } from './components/DataVerificationBar';
import { exportPropertiesToPDF } from './utils/pdfExport';
import { validateAllProperties } from './utils/dataVerification';

function cleanClientError(raw: string): string {
  if (!raw) return 'Wystąpił problem z połączeniem z wyszukiwarką.';
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      return cleanClientError(parsed.error.message);
    }
    if (parsed?.error && typeof parsed.error === 'string') {
      return cleanClientError(parsed.error);
    }
  } catch {}
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED') || raw.toLowerCase().includes('quota')) {
    return 'Przekroczono limit zapytań do API Gemini (429 Quota Exceeded). Odczekaj kilkanaście sekund, limity odnawiają się automatycznie.';
  }
  return raw;
}

export default function App() {
  const [query, setQuery] = useState('2-pokojowe mieszkanie na wynajem Warszawa Mokotów do 3500 zł');
  const [count, setCount] = useState(10);
  const [selectedDealType, setSelectedDealType] = useState<DealType>('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [groundingQueries, setGroundingQueries] = useState<string[]>([]);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfNotification, setPdfNotification] = useState<string | null>(null);
  const [verificationSummary, setVerificationSummary] = useState<VerificationSummary | null>(null);

  // In-results active filter & sort
  const [resultFilter, setResultFilter] = useState<'all' | 'Wynajem' | 'Sprzedaż' | 'Mieszkanie' | 'Dom'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'area-desc'>('default');
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const handleShowOnMap = (property: Property) => {
    const propId = property.id || null;
    setSelectedPropertyId(propId);
    if (viewMode === 'list') {
      setViewMode('split');
    }
    setTimeout(() => {
      const mapElem = document.getElementById('leaflet-property-map');
      if (mapElem) {
        mapElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
  };

  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('propfinder_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleSearch = async (e?: FormEvent, overrideQuery?: string, overrideDealType?: DealType) => {
    if (e) e.preventDefault();
    
    const targetQuery = (overrideQuery ?? query).trim();
    const targetDealType = overrideDealType ?? selectedDealType;

    if (!targetQuery) return;

    if (count > 25) {
      setShowLimitPopup(true);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/search-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: targetQuery, 
          count, 
          dealType: targetDealType 
        })
      });

      if (!response.ok) {
        let errStr = '';
        try {
          const errorData = await response.json();
          errStr = errorData.error || JSON.stringify(errorData);
        } catch {
          errStr = await response.text();
        }
        throw new Error(cleanClientError(errStr));
      }

      const data: SearchResponse = await response.json();
      const rawProperties: Property[] = (data.properties || []).filter(p => {
        if (!p.liveVerification) return true;
        if (p.liveVerification.isLive === false) return false;
        if (p.liveVerification.statusLabel === 'dead_404') return false;
        if (p.liveVerification.statusLabel === 'trap_redirect') return false;
        if (p.liveVerification.statusLabel === 'archived') return false;
        if (p.liveVerification.status === 404 || p.liveVerification.status === 410) return false;
        return true;
      });
      const { properties: validatedProperties, summary } = validateAllProperties(
        rawProperties, 
        targetQuery, 
        data.prunedDeadOffersCount
      );
      setProperties(validatedProperties);
      setVerificationSummary(summary);
      setGroundingQueries(data.groundingQueries || []);
      setGroundingSources(data.groundingSources || []);

      if (data.warning || data.isQuotaExceeded) {
        setQuotaWarning(data.warning || 'Wyczerpano chwilowy limit zapytań Gemini API (429 Quota). Wyświetlam reprezentatywne oferty z polskiego rynku.');
      } else {
        setQuotaWarning(null);
      }

      // Update history in localStorage
      setRecentSearches(prev => {
        const filtered = prev.filter(h => h.query.toLowerCase() !== targetQuery.toLowerCase());
        const newItem: SearchHistoryItem = {
          id: Date.now().toString(),
          query: targetQuery,
          timestamp: Date.now(),
          count: validatedProperties.length,
          dealTypeFilter: targetDealType,
          properties: validatedProperties
        };
        const updated = [newItem, ...filtered].slice(0, 6);
        try {
          localStorage.setItem('propfinder_history', JSON.stringify(updated));
        } catch (err) {
          console.error('Nie udało się zapisać historii wyszukiwania', err);
        }
        return updated;
      });

    } catch (err: any) {
      console.error('Błąd wyszukiwania:', err);
      setError(cleanClientError(err?.message || 'Wystąpił problem z połączeniem z wyszukiwarką.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (presetText: string, presetDealType: DealType = 'all') => {
    setQuery(presetText);
    setSelectedDealType(presetDealType);
    handleSearch(undefined, presetText, presetDealType);
  };

  const handleSelectRecent = (historyItem: SearchHistoryItem) => {
    setQuery(historyItem.query);
    if (historyItem.dealTypeFilter) {
      setSelectedDealType(historyItem.dealTypeFilter as DealType);
    }
    const { properties: validatedProperties, summary } = validateAllProperties(historyItem.properties, historyItem.query);
    setProperties(validatedProperties);
    setVerificationSummary(summary);
    setError('');
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem('propfinder_history');
      setRecentSearches([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyAll = () => {
    if (properties.length === 0) return;
    
    const header = `Zapytanie: ${query}\nZnaleziono ${properties.length} nieruchomości (Rynek Polski)\n====================================\n\n`;
    const body = properties.map((prop, i) => (
      `[${i + 1}] ${prop.title}
Cena: ${prop.price}${prop.pricePerM2 && prop.pricePerM2 !== 'N/A' ? ` (${prop.pricePerM2})` : ''}
Typ: ${prop.propertyType} | ${prop.dealType}
Lokalizacja: ${prop.location}
Powierzchnia: ${prop.area} | Pokoje: ${prop.rooms}
Źródło: ${prop.source} | Link: ${prop.url}
Opis: ${prop.description}
Kontakt: ${prop.contact || 'W ogłoszeniu'}`
    )).join('\n\n------------------------------------\n\n');
    
    const textToCopy = header + body;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }).catch(err => {
      console.error('Nie udało się skopiować ofert: ', err);
    });
  };

  const handleDownloadCSV = () => {
    if (properties.length === 0) return;

    const headers = [
      'Tytuł', 
      'Typ transakcji', 
      'Typ nieruchomości', 
      'Cena', 
      'Cena za m2', 
      'Lokalizacja', 
      'Powierzchnia', 
      'Pokoje', 
      'Piętro', 
      'Źródło', 
      'Link do oferty', 
      'Kontakt', 
      'Opis'
    ];
    const escapeCSV = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    
    const rows = properties.map(p => [
      escapeCSV(p.title),
      escapeCSV(p.dealType),
      escapeCSV(p.propertyType),
      escapeCSV(p.price),
      escapeCSV(p.pricePerM2 || ''),
      escapeCSV(p.location),
      escapeCSV(p.area),
      escapeCSV(p.rooms),
      escapeCSV(p.floor || ''),
      escapeCSV(p.source),
      escapeCSV(p.url),
      escapeCSV(p.contact || ''),
      escapeCSV(p.description)
    ].join(','));

    // Add UTF-8 BOM (\uFEFF) so Microsoft Excel opens Polish characters (ą, ę, ó, ł, etc.) correctly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nieruchomosci_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    const listToExport = filteredProperties.length > 0 ? filteredProperties : properties;
    if (listToExport.length === 0) return;

    setExportingPdf(true);
    setPdfNotification('Generowanie eleganckiego raportu PDF...');
    try {
      await exportPropertiesToPDF(
        listToExport, 
        query, 
        resultFilter === 'all' ? selectedDealType : resultFilter
      );
      setPdfNotification('Raport PDF został pomyślnie pobrany!');
      setTimeout(() => setPdfNotification(null), 3500);
    } catch (err: any) {
      console.error('Błąd eksportu do PDF:', err);
      setPdfNotification('Nie udało się wygenerować PDF: ' + (err?.message || 'Nieoczekiwany błąd'));
      setTimeout(() => setPdfNotification(null), 4500);
    } finally {
      setExportingPdf(false);
    }
  };

  // Filter and sort processed properties
  const filteredProperties = useMemo(() => {
    let list = [...properties];

    // Deal/Type filter
    if (resultFilter === 'Wynajem') {
      list = list.filter(p => p.dealType?.toLowerCase().includes('wynaj') || p.dealType?.toLowerCase().includes('rent'));
    } else if (resultFilter === 'Sprzedaż') {
      list = list.filter(p => p.dealType?.toLowerCase().includes('sprzed') || p.dealType?.toLowerCase().includes('sale'));
    } else if (resultFilter === 'Mieszkanie') {
      list = list.filter(p => p.propertyType?.toLowerCase().includes('mieszkan') || p.propertyType?.toLowerCase().includes('kawaler'));
    } else if (resultFilter === 'Dom') {
      list = list.filter(p => p.propertyType?.toLowerCase().includes('dom') || p.propertyType?.toLowerCase().includes('segment'));
    }

    // Sort
    if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.priceNumeric || 0) - (b.priceNumeric || 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.priceNumeric || 0) - (a.priceNumeric || 0));
    } else if (sortBy === 'area-desc') {
      const getNum = (str: string) => parseFloat(str.replace(/[^\d.]/g, '')) || 0;
      list.sort((a, b) => getNum(b.area) - getNum(a.area));
    }

    return list;
  }, [properties, resultFilter, sortBy]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans p-4 sm:p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-7">
        
        {/* Header */}
        <SearchHeader />

        {/* Main Search Panel */}
        <section className="bg-white rounded-2xl p-5 sm:p-7 shadow-xs border border-neutral-200 space-y-4">
          <form onSubmit={(e) => handleSearch(e)} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="property-query" className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Opisz poszukiwaną nieruchomość w Polsce
                </label>
                <div className="relative">
                  <input
                    id="property-query"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder='np. "2-pokojowe mieszkanie na wynajem Warszawa Mokotów do 3500 zł z balkonem"'
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-neutral-900/40 focus:border-neutral-900 transition-all placeholder:text-neutral-400"
                    required
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs px-1.5 py-0.5 rounded-md"
                    >
                      Wyczyść
                    </button>
                  )}
                </div>
              </div>
              
              <div className="w-full sm:w-28 space-y-1.5">
                <label htmlFor="property-count" className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Liczba ofert
                </label>
                <select
                  id="property-count"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/40 focus:border-neutral-900 transition-all"
                >
                  <option value={5}>5 ofert</option>
                  <option value={10}>10 ofert</option>
                  <option value={15}>15 ofert</option>
                  <option value={20}>20 ofert</option>
                </select>
              </div>

              <button
                id="search-properties-btn"
                type="submit"
                disabled={loading}
                className="w-full md:w-auto bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-medium rounded-xl px-6 py-3 transition-colors flex items-center justify-center gap-2 h-[48px] shrink-0 shadow-xs cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Przeszukuję oferty...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Szukaj ofert</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick presets & Deal Types */}
          <FilterPresets
            onSelectPreset={handleSelectPreset}
            selectedDealType={selectedDealType}
            onChangeDealType={setSelectedDealType}
          />

          {/* Recent Searches */}
          <RecentSearches
            searches={recentSearches}
            onSelectSearch={handleSelectRecent}
            onClearHistory={handleClearHistory}
          />
        </section>

        {/* Quota Notice Banner */}
        {quotaWarning && (
          <div className="bg-amber-50 text-amber-950 p-4 rounded-xl border border-amber-200 flex items-start gap-3 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-amber-900">Tryb demonstracyjny / Limit API Gemini (429)</p>
              <p className="text-amber-800 leading-relaxed">{quotaWarning}</p>
              <div className="pt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSearch()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ponów wyszukiwanie na żywo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold">Błąd wyszukiwania</p>
              <p className="text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => handleSearch()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-900 underline mt-1 hover:text-red-700"
              >
                <RefreshCw className="w-3 h-3" />
                Spróbuj ponownie
              </button>
            </div>
          </div>
        )}

        {/* Search Grounding Info */}
        {(groundingQueries.length > 0 || groundingSources.length > 0) && (
          <GroundingInfo 
            queries={groundingQueries} 
            sources={groundingSources} 
          />
        )}

        {/* Results Section */}
        {properties.length > 0 && (
          <div className="space-y-4">
            {/* Final Data Correctness & Verification Check */}
            <DataVerificationBar 
              properties={properties}
              summary={verificationSummary || undefined}
              query={query}
            />

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-900">
                  Znaleziono {filteredProperties.length} z {properties.length} ofert
                </span>
              </div>

              {/* In-results filter chips & sorting */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Result filters */}
                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setResultFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      resultFilter === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Wszystkie
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultFilter('Wynajem')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      resultFilter === 'Wynajem' ? 'bg-white text-emerald-700 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Wynajem
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultFilter('Sprzedaż')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      resultFilter === 'Sprzedaż' ? 'bg-white text-blue-700 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Sprzedaż
                  </button>
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-1 text-xs">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
                  <select
                    id="sort-by-select"
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 focus:outline-none"
                  >
                    <option value="default">Domyślne</option>
                    <option value="price-asc">Cena: rosnąco</option>
                    <option value="price-desc">Cena: malejąco</option>
                    <option value="area-desc">Powierzchnia: od największej</option>
                  </select>
                </div>

                {/* View Mode Switcher (Lista / Podzielony / Mapa) */}
                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg text-xs">
                  <button
                    id="view-list-btn"
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      viewMode === 'list' 
                        ? 'bg-white text-neutral-900 shadow-xs' 
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                    title="Widok samej listy ogłoszeń"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Lista</span>
                  </button>
                  <button
                    id="view-split-btn"
                    type="button"
                    onClick={() => setViewMode('split')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      viewMode === 'split' 
                        ? 'bg-white text-emerald-700 shadow-xs font-semibold' 
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                    title="Widok podzielony: lista ofert i interaktywna mapa obok siebie"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Podzielony</span>
                  </button>
                  <button
                    id="view-map-btn"
                    type="button"
                    onClick={() => setViewMode('map')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      viewMode === 'map' 
                        ? 'bg-white text-blue-700 shadow-xs font-semibold' 
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                    title="Pełny widok mapy z naniesionymi ogłoszeniami"
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mapa</span>
                  </button>
                </div>

                {/* Actions */}
                <button
                  id="export-pdf-btn"
                  onClick={handleExportPDF}
                  disabled={exportingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title="Pobierz elegancki raport PDF ze wszystkimi znalezionymi ogłoszeniami"
                >
                  {exportingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                      <span>Generuję PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                      <span>PDF</span>
                    </>
                  )}
                </button>

                <button
                  id="export-csv-btn"
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
                  title="Pobierz arkusz CSV ze wszystkimi ogłoszeniami"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>

                <button
                  id="copy-all-btn"
                  onClick={handleCopyAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
                  title="Kopiuj tekstowe podsumowanie wszystkich ofert"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span>Skopiowano</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopiuj wszystkie</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PDF export notification banner if active */}
            {pdfNotification && (
              <div className="mb-4 py-2 px-3.5 bg-neutral-900 text-white text-xs font-medium rounded-lg flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>{pdfNotification}</span>
                </div>
                <button 
                  onClick={() => setPdfNotification(null)}
                  className="text-neutral-400 hover:text-white cursor-pointer text-[11px]"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Property Cards Grid or Split/Map View */}
            {viewMode === 'map' ? (
              <div className="space-y-4">
                <PropertyMap
                  properties={filteredProperties}
                  selectedPropertyId={selectedPropertyId}
                  onSelectProperty={(prop) => setSelectedPropertyId(prop.id || null)}
                  height="640px"
                />
              </div>
            ) : viewMode === 'split' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-6 space-y-4 max-h-[720px] overflow-y-auto pr-1 sm:pr-2">
                  {filteredProperties.map((property, index) => (
                    <PropertyCard
                      key={property.id || index}
                      property={property}
                      index={index}
                      isSelected={selectedPropertyId === (property.id || `prop-${index}`)}
                      onShowOnMap={handleShowOnMap}
                    />
                  ))}
                </div>
                <div className="lg:col-span-6 sticky top-4">
                  <PropertyMap
                    properties={filteredProperties}
                    selectedPropertyId={selectedPropertyId}
                    onSelectProperty={(prop) => setSelectedPropertyId(prop.id || null)}
                    height="720px"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredProperties.map((property, index) => (
                  <PropertyCard
                    key={property.id || index}
                    property={property}
                    index={index}
                    isSelected={selectedPropertyId === (property.id || `prop-${index}`)}
                    onShowOnMap={handleShowOnMap}
                  />
                ))}
              </div>
            )}

            {filteredProperties.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center space-y-2 border border-neutral-200">
                <p className="text-neutral-700 font-medium">Brak ofert pasujących do wybranego filtra.</p>
                <p className="text-xs text-neutral-500">Zmień filtr lub wybierz „Wszystkie”, aby zobaczyć pozostałe wyniki.</p>
              </div>
            )}
          </div>
        )}

        {/* Initial Empty State (before first search) */}
        {!loading && properties.length === 0 && !error && (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-neutral-200 shadow-xs space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
              <Home className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl font-semibold text-neutral-900">
                Wyszukaj wymarzoną nieruchomość w Polsce
              </h2>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Wpisz dowolne kryteria — miasto, dzielnicę, metraż, cenę, piętro czy dodatkowe udogodnienia (balkon, garaż, winda). Wyszukiwarka znajdzie aktualne oferty z polskich portali nieruchomościowych.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSelectPreset('2-pokojowe mieszkanie na wynajem Warszawa Mokotów do 3500 zł', 'Wynajem')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium transition-colors shadow-xs"
              >
                <Search className="w-4 h-4" />
                <span>Wypróbuj przykładowe zapytanie (Warszawa Mokotów)</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Limit Modal */}
      {showLimitPopup && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Limit liczby ofert</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Dla zachowania maksymalnej dokładności wyszukiwania w Google oraz uniknięcia opóźnień, zalecamy wyszukiwanie do 20 ofert naraz.
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setCount(20);
                  setShowLimitPopup(false);
                }}
                className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                Ustaw 20 i zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
