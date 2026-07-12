/**
 * Dark-themed Leaflet map of the stadiums with listings. Gold pins open a
 * popup summarizing that venue's palcos; "Ver palcos" jumps to the filtered
 * list. Free Carto dark tiles (no API key).
 */
import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, AttributionControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { FeedEntry, Stadium } from "@/lib/api";
import { formatMXN } from "@/lib/format";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif" } as const;

const goldPin = L.divIcon({
  className: "gold-pin",
  html: '<span class="gold-pin-dot"></span><span class="gold-pin-pulse"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

interface StadiumSummary {
  stadium: Stadium;
  count: number;
  minPrice: number;
}

export default function StadiumMap({
  stadiums,
  entries,
  onSelectStadium,
}: {
  stadiums: Stadium[];
  entries: FeedEntry[];
  onSelectStadium: (stadiumId: string) => void;
}) {
  const summaries = useMemo<StadiumSummary[]>(() => {
    return stadiums
      .filter((s) => s.latitude !== 0 || s.longitude !== 0)
      .map((stadium) => {
        const forStadium = entries.filter((e) => e.stadium_id === stadium.id);
        return {
          stadium,
          count: forStadium.length,
          minPrice: forStadium.length ? Math.min(...forStadium.map((e) => e.price)) : 0,
        };
      });
  }, [stadiums, entries]);

  const bounds = useMemo(() => {
    if (summaries.length === 0) return undefined;
    return L.latLngBounds(summaries.map((s) => [s.stadium.latitude, s.stadium.longitude] as [number, number])).pad(0.35);
  }, [summaries]);

  return (
    <div className="rounded-lg overflow-hidden border border-white/10">
      <MapContainer
        bounds={bounds}
        center={bounds ? undefined : [23.6, -102.5]}
        zoom={bounds ? undefined : 5}
        scrollWheelZoom={false}
        attributionControl={false}
        style={{ height: "520px", width: "100%", background: "oklch(0.09 0.005 260)" }}
      >
        {/* Required credit for the free OSM/CARTO tiles, restyled dark. */}
        <AttributionControl prefix={false} position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {summaries.map(({ stadium, count, minPrice }) => (
          <Marker key={stadium.id} position={[stadium.latitude, stadium.longitude]} icon={goldPin}>
            <Popup>
              <div className="px-1 py-0.5 min-w-44">
                <div className="text-base font-semibold" style={serif}>
                  {stadium.name}
                </div>
                <div className="text-xs opacity-70 mb-2" style={outfit}>
                  {stadium.city}
                </div>
                {count > 0 ? (
                  <div className="text-xs mb-3" style={outfit}>
                    {count} palco{count === 1 ? "" : "s"} disponible{count === 1 ? "" : "s"} · desde{" "}
                    <span className="map-gold font-semibold">{formatMXN(minPrice)}</span>
                  </div>
                ) : (
                  <div className="text-xs mb-3 italic opacity-70" style={outfit}>
                    Sin fechas publicadas por ahora
                  </div>
                )}
                <button
                  onClick={() => onSelectStadium(stadium.id)}
                  className="map-popup-btn"
                  style={outfit}
                >
                  Ver palcos →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
