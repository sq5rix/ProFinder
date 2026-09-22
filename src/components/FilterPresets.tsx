import { DealType } from '../types';

interface FilterPresetsProps {
  onSelectPreset: (promptText: string, dealType?: DealType) => void;
  selectedDealType: DealType;
  onChangeDealType: (dealType: DealType) => void;
}

const PRESETS: Array<{ label: string; query: string; dealType: DealType }> = [
  {
    label: 'Warszawa: 2 pok. wynajem Mokotów (<3.5k zł)',
    query: '2-pokojowe mieszkanie na wynajem Warszawa Mokotów z balkonem do 3500 zł',
    dealType: 'Wynajem',
  },
  {
    label: 'Kraków: 3 pok. sprzedaż (<850k zł)',
    query: 'Mieszkanie 3 pokoje na sprzedaż Kraków Krowodrza lub Podgórze do 850 000 zł',
    dealType: 'Sprzedaż',
  },
  {
    label: 'Wrocław: Kawalerka wynajem Centrum',
    query: 'Kawalerka do wynajęcia Wrocław Stare Miasto lub Śródmieście umeblowana',
    dealType: 'Wynajem',
  },
  {
    label: 'Poznań: Dom z ogrodem sprzedaż',
    query: 'Dom wolnostojący z ogrodem na sprzedaż okolice Poznania lub Tarnowo Podgórne',
    dealType: 'Sprzedaż',
  },
  {
    label: 'Trójmiasto: Mieszkanie blisko morza',
    query: 'Mieszkanie na sprzedaż Gdańsk Przymorze lub Zaspa blisko morza',
    dealType: 'Sprzedaż',
  },
];

export function FilterPresets({ 
  onSelectPreset, 
  selectedDealType, 
  onChangeDealType 
}: FilterPresetsProps) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Deal Type Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl border border-neutral-200/80">
          <button
            type="button"
            onClick={() => onChangeDealType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedDealType === 'all'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Wszystkie
          </button>
          <button
            type="button"
            onClick={() => onChangeDealType('Wynajem')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedDealType === 'Wynajem'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Wynajem
          </button>
          <button
            type="button"
            onClick={() => onChangeDealType('Sprzedaż')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedDealType === 'Sprzedaż'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Sprzedaż
          </button>
        </div>

        <span className="text-neutral-400 hidden sm:inline">
          Kliknij podpowiedź poniżej, aby szybko sprawdzić:
        </span>
      </div>

      {/* Preset Chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mr-1">
          Popularne:
        </span>
        {PRESETS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPreset(preset.query, preset.dealType)}
            className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-full transition-colors font-medium border border-neutral-200/60 hover:border-neutral-300"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
