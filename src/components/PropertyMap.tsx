import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '../types';
import { resolvePropertyCoordinates } from '../utils/geocoding';
import { 
  Maximize2, 
  MapPin, 
  ExternalLink, 
  Phone, 
  Layers, 
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface PropertyMapProps {
  properties: Property[];
  selectedPropertyId?: string | null;
  onSelectProperty?: (property: Property) => void;
  className?: string;
  height?: string;
}

interface PlottedProperty {
  property: Property;
  lat: number;
  lng: number;
  priceShort: string;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  selectedPropertyId,
  onSelectProperty,
  className = '',
  height = '520px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Compute plotted coordinates for each property
  const plottedProperties: PlottedProperty[] = useMemo(() => {
    return properties.map((prop, idx) => {
      const coords = resolvePropertyCoordinates(
        prop.location,
        prop.id || `prop_${idx}`,
        prop.latitude,
        prop.longitude
      );

      // Format short price tag (e.g. "3 400 zł", "850k zł")
      let priceShort = prop.price || '';
      if (prop.priceNumeric) {
        if (prop.priceNumeric >= 1000000) {
          priceShort = `${(prop.priceNumeric / 1000000).toFixed(1).replace('.0', '')}M zł`;
        } else if (prop.priceNumeric >= 100000) {
          priceShort = `${Math.round(prop.priceNumeric / 1000)}k zł`;
        } else {
          priceShort = `${prop.priceNumeric.toLocaleString('pl-PL')} zł`;
        }
      } else {
        priceShort = priceShort.replace(' / mies.', '').replace(' PLN', ' zł').slice(0, 12);
      }

      return {
        property: prop,
        lat: coords ? coords.lat : 52.2297,
        lng: coords ? coords.lng : 21.0122,
        priceShort
      };
    });
  }, [properties]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Poland (Warsaw coordinates by default)
    const map = L.map(mapContainerRef.current, {
      center: [52.2297, 21.0122],
      zoom: 12,
      zoomControl: false,
      attributionControl: true
    });

    // High quality OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add custom position zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;
    setIsMapReady(true);

    // Observer to re-calculate container dimensions if resized or tab switched
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers whenever plottedProperties change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    if (plottedProperties.length === 0) return;

    const bounds = L.latLngBounds([]);

    plottedProperties.forEach((item, index) => {
      const { property, lat, lng, priceShort } = item;
      const propId = property.id || `prop-${index}`;
      const isRent = property.dealType?.toLowerCase().includes('wynaj') || property.dealType?.toLowerCase().includes('rent');
      const hasPhone = Boolean(property.hasPhoneNumber || property.phoneNumber);
      const isSelected = selectedPropertyId === propId;

      bounds.extend([lat, lng]);

      // Custom HTML Marker Pill
      const markerHtml = `
        <div class="property-marker-pill ${isSelected ? 'is-selected' : ''}" style="
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 9999px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 3px 8px rgba(0,0,0,0.18);
          border: 2px solid #ffffff;
          ${isRent 
            ? 'background-color: #059669; color: #ffffff;' 
            : 'background-color: #2563eb; color: #ffffff;'}
          ${isSelected ? 'transform: scale(1.15); box-shadow: 0 0 0 3px #fbbf24, 0 8px 16px rgba(0,0,0,0.3); z-index: 1000;' : ''}
        ">
          ${hasPhone ? '<span style="font-size: 10px;">📞</span>' : ''}
          <span>${priceShort}</span>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-property-marker-wrapper',
        html: markerHtml,
        iconSize: [80, 28],
        iconAnchor: [40, 14]
      });

      const marker = L.marker([lat, lng], { icon, title: property.title }).addTo(map);

      // Click handler
      marker.on('click', () => {
        setActiveProperty(property);
        if (onSelectProperty) {
          onSelectProperty(property);
        }
        map.panTo([lat, lng], { animate: true, duration: 0.5 });
      });

      markersRef.current.set(propId, marker);
    });

    // Auto-fit bounds if we have valid coordinates
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 15,
        animate: true
      });
    }
  }, [plottedProperties, selectedPropertyId, isMapReady, onSelectProperty]);

  // Center map on selectedPropertyId if provided externally
  useEffect(() => {
    if (!selectedPropertyId || !mapInstanceRef.current) return;
    const found = plottedProperties.find(p => (p.property.id || '') === selectedPropertyId);
    if (found) {
      setActiveProperty(found.property);
      mapInstanceRef.current.panTo([found.lat, found.lng], { animate: true, duration: 0.6 });
    }
  }, [selectedPropertyId, plottedProperties]);

  // Handler to fit all bounds
  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map || plottedProperties.length === 0) return;
    const bounds = L.latLngBounds(plottedProperties.map(p => [p.lat, p.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true
      });
    }
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm flex flex-col ${className}`}>
      {/* Map Header Bar */}
      <div className="px-4 py-3 bg-white/95 backdrop-blur-xs border-b border-neutral-100 flex items-center justify-between z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <span>Lokalizacje na mapie</span>
              <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {plottedProperties.length} ofert
              </span>
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="map-fit-bounds-btn"
            type="button"
            onClick={handleFitAll}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 hover:text-neutral-900 rounded-lg transition-colors cursor-pointer"
            title="Dopasuj widok do wszystkich ofert"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dopasuj widok</span>
          </button>
        </div>
      </div>

      {/* The Leaflet Container */}
      <div className="relative w-full" style={{ height }}>
        <div 
          ref={mapContainerRef} 
          id="leaflet-property-map" 
          className="w-full h-full z-0"
        />

        {/* Legend Overlay */}
        <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-neutral-200/80 text-[11px] font-medium flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
            <span className="text-neutral-700">Wynajem</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
            <span className="text-neutral-700">Sprzedaż</span>
          </div>
          <div className="flex items-center gap-1 text-neutral-500 pl-1 border-l border-neutral-200">
            <span>📞</span>
            <span>Tel. bezpośredni</span>
          </div>
        </div>

        {/* Interactive Selected Property Popup Drawer */}
        {activeProperty && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-md z-[500] bg-white/98 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200 p-4 animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  activeProperty.dealType?.toLowerCase().includes('wynaj') 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  {activeProperty.dealType || 'Oferta'}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-700">
                  {activeProperty.propertyType}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                  {activeProperty.source}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveProperty(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md transition-colors"
                title="Zamknij podgląd"
              >
                ✕
              </button>
            </div>

            <h4 className="font-bold text-sm text-neutral-900 leading-snug mb-1 line-clamp-2">
              {activeProperty.title}
            </h4>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-lg font-extrabold text-neutral-900">
                {activeProperty.price}
              </span>
              {activeProperty.pricePerM2 && activeProperty.pricePerM2 !== 'N/A' && (
                <span className="text-xs text-neutral-500 font-medium">
                  ({activeProperty.pricePerM2})
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-600 mb-3 font-medium">
              <span>📍 {activeProperty.location}</span>
              <span>•</span>
              <span>{activeProperty.area}</span>
              <span>•</span>
              <span>{activeProperty.rooms}</span>
            </div>

            <p className="text-xs text-neutral-600 line-clamp-2 mb-3 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
              {activeProperty.description}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100">
              {activeProperty.phoneNumber ? (
                <a
                  href={`tel:${activeProperty.phoneNumber.replace(/[\s-]/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Zadzwoń: {activeProperty.phoneNumber}</span>
                </a>
              ) : (
                <div className="text-[11px] text-neutral-500 font-medium">
                  {activeProperty.contact || 'Kontakt w ogłoszeniu'}
                </div>
              )}

              <a
                href={activeProperty.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-colors shrink-0"
              >
                <span>Otwórz ofertę</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
