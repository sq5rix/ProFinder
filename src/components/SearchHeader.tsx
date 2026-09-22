import { Home, Sparkles } from 'lucide-react';

export function SearchHeader() {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-sm">
            <Home className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                PropFinder
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Polska / PL
              </span>
            </div>
            <p className="text-sm text-neutral-500 font-medium">
              Wyszukiwarka ofert nieruchomości na polskim rynku
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-600 bg-white px-3 py-1.5 rounded-full border border-neutral-200 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Przeszukuje Otodom, OLX, Morizon i inne</span>
        </div>
      </div>
      <p className="text-neutral-600 text-base max-w-3xl leading-relaxed">
        Opisz czego szukasz dowolnym językiem lub po polsku — np. lokalizację, budżet, liczbę pokoi, balkon czy ogród. Sztuczna inteligencja przeszukuje aktualne ogłoszenia w sieci i wyciąga kluczowe parametry.
      </p>
    </header>
  );
}
