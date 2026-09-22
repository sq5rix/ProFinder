import { Clock, Trash2, ChevronRight } from 'lucide-react';
import { SearchHistoryItem } from '../types';

interface RecentSearchesProps {
  searches: SearchHistoryItem[];
  onSelectSearch: (item: SearchHistoryItem) => void;
  onClearHistory: () => void;
}

export function RecentSearches({ searches, onSelectSearch, onClearHistory }: RecentSearchesProps) {
  if (searches.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-neutral-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          <span>Ostatnie wyszukiwania</span>
        </div>
        <button
          type="button"
          onClick={onClearHistory}
          className="text-xs text-neutral-400 hover:text-red-600 transition-colors flex items-center gap-1"
          title="Wyczyść historię"
        >
          <Trash2 className="w-3 h-3" />
          <span>Wyczyść historię</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {searches.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectSearch(item)}
            className="group flex items-center gap-1.5 text-xs bg-neutral-50 hover:bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-full border border-neutral-200 transition-all text-left max-w-full sm:max-w-xs truncate"
            title={item.query}
          >
            <span className="truncate flex-1">{item.query}</span>
            <span className="text-[10px] text-neutral-400 group-hover:text-neutral-600">
              ({item.properties.length})
            </span>
            <ChevronRight className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
