import { Globe, Search, ExternalLink } from 'lucide-react';
import { GroundingSource } from '../types';

interface GroundingInfoProps {
  queries?: string[];
  sources?: GroundingSource[];
}

export function GroundingInfo({ queries = [], sources = [] }: GroundingInfoProps) {
  if (queries.length === 0 && sources.length === 0) return null;

  return (
    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80 text-xs space-y-2.5">
      {queries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 font-semibold text-neutral-600">
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <span>Zapytania Google:</span>
          </div>
          {queries.map((q, idx) => (
            <span key={idx} className="bg-white px-2.5 py-1 rounded-md text-neutral-700 border border-neutral-200">
              {q}
            </span>
          ))}
        </div>
      )}

      {sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 font-semibold text-neutral-600">
            <Globe className="w-3.5 h-3.5 text-neutral-400" />
            <span>Zweryfikowane źródła:</span>
          </div>
          {sources.slice(0, 6).map((source, idx) => (
            <a
              key={idx}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-white hover:bg-neutral-100 text-blue-600 px-2.5 py-1 rounded-md border border-neutral-200 transition-colors"
            >
              <span>{source.title || 'Otodom / OLX'}</span>
              <ExternalLink className="w-2.5 h-2.5 text-neutral-400" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
