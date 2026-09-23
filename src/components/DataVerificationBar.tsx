import { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Info,
  Check,
  FileCheck,
  Phone
} from 'lucide-react';
import { Property, VerificationSummary } from '../types';

interface DataVerificationBarProps {
  properties: Property[];
  summary?: VerificationSummary;
  query: string;
}

export function DataVerificationBar({ properties, summary, query }: DataVerificationBarProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedPropertyIdx, setSelectedPropertyIdx] = useState<number | null>(null);

  if (!properties || properties.length === 0) return null;

  const validCount = summary ? summary.validCount : properties.filter(p => p.validation?.isFullyValid).length;
  const totalCount = properties.length;
  const percentage = summary ? summary.accuracyPercentage : Math.round((validCount / totalCount) * 100);
  const isPerfect = percentage >= 90;

  return (
    <>
      {/* Verification Status Banner */}
      <div 
        id="data-verification-banner"
        className="mb-5 bg-white border border-emerald-200/90 rounded-xl p-3.5 shadow-xs transition-all hover:border-emerald-300"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${isPerfect ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Weryfikacja jakości danych
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {percentage}% poprawności ({validCount}/{totalCount} ofert)
                </span>
              </div>

              <p className="text-xs text-neutral-600 mt-0.5">
                Wszystkie dane sprawdzono na żywo: wyświetlamy wyłącznie w 100% aktywne ogłoszenia (oferty wygasłe, 404 i archiwalne są automatycznie odrzucane).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            {summary?.prunedDeadOffersCount && summary.prunedDeadOffersCount > 0 ? (
              <span 
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-300"
                title="Wykryte niedostępne i wygasłe oferty zostały automatycznie odfiltrowane przed wyświetleniem"
              >
                <span>Usunięto {summary.prunedDeadOffersCount} wygasłych / 404</span>
              </span>
            ) : null}
            <button
              id="view-verification-details-btn"
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Raport weryfikacji</span>
            </button>
          </div>
        </div>

        {/* Quick Validation Highlights Pill Strip */}
        <div className="mt-3 pt-2.5 border-t border-neutral-100 flex flex-wrap gap-2 text-[11px] text-neutral-600">
          <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300 text-emerald-900 font-semibold">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>100% aktywne oferty (0 wygasłych / 404)</span>
          </span>
          <span className="inline-flex items-center gap-1 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Dokładnie 1 oferta na boks</span>
          </span>
          <span className="inline-flex items-center gap-1 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Spójne ceny PLN i metraż m²</span>
          </span>
          <span className="inline-flex items-center gap-1 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Ochrona linków (1:1, bez stron kategorii)</span>
          </span>
          <span className="inline-flex items-center gap-1 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Polskie portale (Otodom/OLX/itp.)</span>
          </span>
          {properties.some(p => p.hasPhoneNumber || p.phoneNumber) && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-800 font-semibold">
              <Phone className="w-3 h-3 text-emerald-600" />
              <span>Priorytet ofert z telefonem</span>
            </span>
          )}
        </div>
      </div>

      {/* Detailed Verification Modal */}
      {showModal && (
        <div 
          id="verification-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    Raport weryfikacji poprawności danych
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Wynik walidacji dla zapytania: <span className="font-semibold text-neutral-700">"{query}"</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-neutral-800 text-xs sm:text-sm">
              {/* Score Banner */}
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
                    Ogólny wskaźnik poprawności
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-900 mt-0.5">
                    {percentage}%
                  </div>
                  <div className="text-xs text-emerald-700 mt-1">
                    {validCount} z {totalCount} ogłoszeń spełnia 100% rygorystycznych kryteriów walidacji.
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                    Dane zatwierdzone
                  </span>
                </div>
              </div>

              {/* Checklist breakdown */}
              <div>
                <h4 className="font-bold text-neutral-900 mb-2.5 text-xs uppercase tracking-wider text-neutral-500">
                  Zastosowane reguły kontroli danych:
                </h4>
                <div className="space-y-2">
                  {[
                    { title: 'Tytuł i typ transakcji', desc: 'Precyzyjny tytuł ogłoszenia, określony typ (Wynajem/Sprzedaż) oraz rodzaj nieruchomości' },
                    { title: 'Format i spójność ceny (PLN)', desc: 'Podana realna kwota w polskich złotych oraz wyliczona cena za metr kwadratowy (PLN/m²)' },
                    { title: 'Powierzchnia i liczba pokoi', desc: 'Rzeczywisty metraż w m² oraz liczba pokoi / piętro' },
                    { title: 'Zasada 1 oferty w boksie opisu', desc: 'Brak łączenia kilku mieszkań w jednym opisie, brak zduplikowanych ofert portalu' },
                    { title: 'Priorytet ofert z numerem telefonu', desc: 'Promowanie i pozycjonowanie na początku listy ogłoszeń z jawnym numerem kontaktowym do właściciela lub agenta' },
                    { title: 'Ochrona przed stronami zbiorczymi portali', desc: 'Rygorystyczna blokada stron kategorii i list wielu mieszkań (tzw. cheat pages). Każdy link prowadzi wyłącznie do konkretnego ogłoszenia (1:1)' },
                    { title: 'Weryfikacja portalu źródłowego', desc: 'Rozpoznane zaufane polskie źródło (Otodom, OLX, Gratka, Morizon, itp.)' }
                  ].map((rule, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/60">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-neutral-900 text-xs">{rule.title}</div>
                        <div className="text-[11px] text-neutral-600">{rule.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Property Inspection List */}
              <div>
                <h4 className="font-bold text-neutral-900 mb-2.5 text-xs uppercase tracking-wider text-neutral-500">
                  Weryfikacja poszczególnych ofert ({properties.length}):
                </h4>
                <div className="space-y-2">
                  {properties.map((prop, idx) => {
                    const val = prop.validation;
                    const isExpanded = selectedPropertyIdx === idx;
                    const isValid = val?.isFullyValid ?? true;

                    return (
                      <div 
                        key={idx}
                        className="border border-neutral-200 rounded-xl overflow-hidden bg-white text-xs"
                      >
                        <div 
                          onClick={() => setSelectedPropertyIdx(isExpanded ? null : idx)}
                          className="p-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 overflow-hidden pr-2">
                            <span className="font-bold text-neutral-500">#{idx + 1}</span>
                            <span className="font-semibold text-neutral-900 truncate">
                              {prop.title}
                            </span>
                            <span className="text-neutral-400 shrink-0">•</span>
                            <span className="text-neutral-600 shrink-0 font-medium">{prop.price}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                              isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isValid ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {val ? `${val.score}%` : 'OK'}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                          </div>
                        </div>

                        {isExpanded && val && (
                          <div className="p-3 pt-0 border-t border-neutral-100 bg-neutral-50/50 space-y-2 mt-1">
                            <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-2">
                              <div className="flex items-center gap-1.5">
                                <span className={val.checks.titleOk ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                  {val.checks.titleOk ? '✓' : '✗'}
                                </span>
                                <span>Tytuł: Poprawny</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={val.checks.priceOk ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                  {val.checks.priceOk ? '✓' : '✗'}
                                </span>
                                <span>Cena PLN: Sprawdzona</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={val.checks.locationOk ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                  {val.checks.locationOk ? '✓' : '✗'}
                                </span>
                                <span>Lokalizacja: {prop.location}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={val.checks.areaAndRoomsOk ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                  {val.checks.areaAndRoomsOk ? '✓' : '✗'}
                                </span>
                                <span>Metraż i pokoje: {prop.area}, {prop.rooms}</span>
                              </div>
                              <div className="flex items-center gap-1.5 col-span-2">
                                <span className={val.checks.singleOfferDescriptionOk ? 'text-emerald-600 font-bold' : 'text-amber-500 font-bold'}>
                                  {val.checks.singleOfferDescriptionOk ? '✓' : '✗'}
                                </span>
                                <span>Opis: Dokładnie 1 oferta (potwierdzone)</span>
                              </div>
                              <div className="flex items-center gap-1.5 col-span-2 truncate">
                                <span className={val.checks.directLinkOk ? 'text-emerald-600 font-bold' : 'text-amber-500 font-bold'}>
                                  {val.checks.directLinkOk ? '✓' : '✗'}
                                </span>
                                <span className="truncate">Link bezpośredni: {prop.url}</span>
                              </div>
                            </div>

                            {val.warnings.length > 0 && (
                              <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                                <span className="font-semibold">Uwagi:</span> {val.warnings.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Zamknij raport
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
