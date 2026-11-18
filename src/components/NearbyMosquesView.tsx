import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import {
  ArrowLeft,
  Compass,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { FooterDisclaimer } from "./FooterDisclaimer";

type PlaceFilter = "all" | "mosque" | "mushala";

interface MosqueResult {
  id: string;
  name: string;
  address: string;
  location: google.maps.LatLngLiteral;
  mapsUri?: string;
  rating?: number;
  ratingCount?: number;
  kind: "mosque" | "mushala";
  distanceMeters: number;
}

function isQuotaError(err: unknown): boolean {
  const msg = String(
    err instanceof Error ? `${err.name} ${err.message}` : typeof err === "object" && err !== null ? JSON.stringify(err) : err
  );
  return (
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("OVER_QUERY_LIMIT") ||
    msg.includes("OverQuotaMapError") ||
    msg.includes("QuotaExceededError")
  );
}

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function classifyPlaceKind(name: string, typeText?: string): "mosque" | "mushala" {
  const combined = `${name} ${typeText || ""}`.toLocaleLowerCase("id");
  if (/(mushol|mushal|musal|surau|langgar|tajug|al-?mus)/i.test(combined)) {
    return "mushala";
  }
  return "mosque";
}

function haversineFallbackMeters(a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const r = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const h = s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

const PLACE_FIELDS = [
  "id",
  "displayName",
  "location",
  "formattedAddress",
  "googleMapsURI",
  "rating",
  "userRatingCount",
  "primaryTypeDisplayName",
];

// Helper mounted inside APIProvider to resolve a manual text query when GPS was denied
const ManualAreaResolver: React.FC<{
  pendingManualQuery: string;
  onResolved: (center: google.maps.LatLngLiteral, label: string) => void;
  onFailed: (msg: string) => void;
}> = ({ pendingManualQuery, onResolved, onFailed }) => {
  const placesLib = useMapsLibrary("places");

  useEffect(() => {
    const q = pendingManualQuery.trim();
    if (!q || !placesLib) return;
    let active = true;

    placesLib.Place.searchByText({
      fields: ["location", "displayName"],
      textQuery: `${q} masjid mushala`,
      maxResultCount: 1,
      language: "id",
      region: "ID",
    })
      .then((res) => {
        if (!active) return;
        const first = res.places?.[0];
        if (!first?.location) {
          onFailed(`Lokasi atau tempat ibadah untuk "${q}" tidak ditemukan.`);
          return;
        }
        onResolved(
          { lat: first.location.lat(), lng: first.location.lng() },
          `Area "${q}"`
        );
      })
      .catch((err) => {
        if (!active) return;
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
          onFailed("Batas penggunaan Google Maps sementara tercapai.");
        } else {
          onFailed("Gagal mencari area tersebut di Google Maps.");
        }
      });

    return () => {
      active = false;
    };
  }, [pendingManualQuery, placesLib, onResolved, onFailed]);

  return null;
};

interface MapWorkspaceProps {
  center: google.maps.LatLngLiteral;
  userPosition: google.maps.LatLngLiteral | null;
  locationLabel: string;
  filter: PlaceFilter;
  radiusMeters: number;
  searchQuery: string;
  searchTrigger: number;
  onCenterChange: (center: google.maps.LatLngLiteral) => void;
  onResultsChange: (items: MosqueResult[]) => void;
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  onStatusChange: (loading: boolean, error: string) => void;
}

const MapWorkspace: React.FC<MapWorkspaceProps> = ({
  center,
  userPosition,
  locationLabel,
  filter,
  radiusMeters,
  searchQuery,
  searchTrigger,
  onCenterChange,
  onResultsChange,
  selectedId,
  onSelectId,
  onStatusChange,
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary("places");
  const geometryLib = useMapsLibrary("geometry");
  const [results, setResults] = useState<MosqueResult[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const markerRefs = useRef<Record<string, google.maps.marker.AdvancedMarkerElement | null>>({});

  useEffect(() => {
    if (!map) return;
    map.panTo(center);
  }, [map, center]);

  const computeDistance = useCallback(
    (a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral) => {
      if (geometryLib?.spherical) {
        return geometryLib.spherical.computeDistanceBetween(a, b);
      }
      return haversineFallbackMeters(a, b);
    },
    [geometryLib]
  );

  const runSearch = useCallback(async () => {
    if (!placesLib || !mapReady) return;
    const clampedRadius = Math.max(500, Math.min(50000, radiusMeters));
    onStatusChange(true, "");

    try {
      const collected: Record<string, MosqueResult> = {};
      const trimmed = searchQuery.trim();

      const mapPlaceToResult = (
        place: google.maps.places.Place,
        forcedKind?: "mosque" | "mushala"
      ): MosqueResult | null => {
        const loc = place.location;
        if (!loc || !place.id) return null;
        const latLng = { lat: loc.lat(), lng: loc.lng() };
        const name = place.displayName || "Tempat Ibadah";
        const kind = forcedKind ?? classifyPlaceKind(name, place.primaryTypeDisplayName || undefined);
        return {
          id: place.id,
          name,
          address: place.formattedAddress || "Alamat tersedia di Google Maps",
          location: latLng,
          mapsUri:
            place.googleMapsURI ||
            `https://www.google.com/maps/search/?api=1&query=${latLng.lat},${latLng.lng}`,
          rating: typeof place.rating === "number" ? place.rating : undefined,
          ratingCount:
            typeof place.userRatingCount === "number" ? place.userRatingCount : undefined,
          kind,
          distanceMeters: computeDistance(center, latLng),
        };
      };

      if (trimmed) {
        const textResponse = await placesLib.Place.searchByText({
          fields: PLACE_FIELDS,
          textQuery: `${trimmed} masjid mushala`,
          locationBias: { center, radius: clampedRadius },
          maxResultCount: 16,
          language: "id",
          region: "ID",
        });

        for (const p of textResponse.places || []) {
          const item = mapPlaceToResult(p);
          if (item && (filter === "all" || item.kind === filter)) {
            collected[item.id] = item;
          }
        }
      } else {
        const tasks: Array<Promise<void>> = [];

        if (filter === "all" || filter === "mosque") {
          tasks.push(
            placesLib.Place.searchNearby({
              fields: PLACE_FIELDS,
              locationRestriction: { center, radius: clampedRadius },
              includedPrimaryTypes: ["mosque"],
              maxResultCount: 15,
              rankPreference: placesLib.SearchNearbyRankPreference.DISTANCE,
              language: "id",
              region: "ID",
            }).then((res) => {
              for (const p of res.places || []) {
                const item = mapPlaceToResult(p);
                if (item) collected[item.id] = item;
              }
            })
          );
        }

        if (filter === "all" || filter === "mushala") {
          tasks.push(
            placesLib.Place.searchByText({
              fields: PLACE_FIELDS,
              textQuery: "mushola OR mushala OR surau",
              locationBias: { center, radius: clampedRadius },
              maxResultCount: 12,
              language: "id",
              region: "ID",
            }).then((res) => {
              for (const p of res.places || []) {
                const item = mapPlaceToResult(p, "mushala");
                if (item && !collected[item.id] && item.distanceMeters <= clampedRadius * 1.4) {
                  collected[item.id] = item;
                }
              }
            })
          );
        }

        await Promise.all(tasks);
      }

      const sorted = Object.values(collected).sort((a, b) => a.distanceMeters - b.distanceMeters);
      setResults(sorted);
      onResultsChange(sorted);
      if (sorted.length > 0) {
        onSelectId(sorted[0].id);
      } else {
        onSelectId(null);
      }
      onStatusChange(false, "");
    } catch (err) {
      if (isQuotaError(err)) {
        window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
        onStatusChange(false, "Batas penggunaan Google Maps sementara tercapai.");
        return;
      }
      onStatusChange(
        false,
        "Gagal memuat daftar masjid dan mushala dari Google Maps. Coba muat ulang area ini."
      );
    }
  }, [
    placesLib,
    mapReady,
    radiusMeters,
    searchQuery,
    center,
    filter,
    computeDistance,
    onResultsChange,
    onSelectId,
    onStatusChange,
  ]);

  useEffect(() => {
    void runSearch();
  }, [runSearch, searchTrigger]);

  const selectedPlace = useMemo(
    () => results.find((item) => item.id === selectedId) || null,
    [results, selectedId]
  );

  useEffect(() => {
    if (!map || !selectedPlace) return;
    map.panTo(selectedPlace.location);
  }, [map, selectedPlace]);

  return (
    <div className="relative h-[340px] w-full overflow-hidden rounded-2xl border border-[#dce4df] bg-[#eef4f0] shadow-xs sm:h-[420px] dark:border-slate-800 dark:bg-[#0F1722]">
      <GoogleMap
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
        defaultCenter={center}
        defaultZoom={14}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        onIdle={() => {
          if (!mapReady) setMapReady(true);
        }}
        className="h-full w-full"
      >
        {userPosition && (
          <AdvancedMarker position={userPosition} title={`Lokasi Anda (${locationLabel})`}>
            <Pin background="#0284c7" borderColor="#0369a1" glyphColor="#ffffff" />
          </AdvancedMarker>
        )}

        {results.map((item) => {
          const isSelected = item.id === selectedId;
          const pinColor = item.kind === "mushala" ? "#9c7d3c" : "#134a35";
          return (
            <AdvancedMarker
              key={item.id}
              ref={(el) => {
                markerRefs.current[item.id] = el;
              }}
              position={item.location}
              title={item.name}
              onClick={() => onSelectId(item.id)}
            >
              <Pin
                background={isSelected ? "#d97706" : pinColor}
                borderColor="#ffffff"
                glyphColor="#ffffff"
                scale={isSelected ? 1.15 : 0.95}
              />
            </AdvancedMarker>
          );
        })}

        {selectedPlace && (
          <InfoWindow
            anchor={markerRefs.current[selectedPlace.id] || undefined}
            position={markerRefs.current[selectedPlace.id] ? undefined : selectedPlace.location}
            onCloseClick={() => onSelectId(null)}
          >
            <div className="max-w-[230px] p-0.5 text-[#1d2c24]">
              <p className="text-[10px] font-semibold tracking-wider text-[#9c7d3c] uppercase">
                {selectedPlace.kind === "mushala" ? "Mushala" : "Masjid"} ·{" "}
                {formatDistance(selectedPlace.distanceMeters)}
              </p>
              <h4 className="mt-0.5 text-xs font-bold text-[#103d2c]">{selectedPlace.name}</h4>
              <p className="mt-1 line-clamp-2 text-[11px] text-[#52655a]">
                {selectedPlace.address}
              </p>
              {selectedPlace.mapsUri && (
                <a
                  href={selectedPlace.mapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#134a35] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#0e3928]"
                >
                  <Navigation className="h-3 w-3" />
                  <span>Petunjuk Arah</span>
                </a>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {map && (
        <button
          type="button"
          onClick={() => {
            const c = map.getCenter();
            if (c) {
              onCenterChange({ lat: c.lat(), lng: c.lng() });
            }
          }}
          className="absolute bottom-3 left-1/2 z-10 inline-flex min-h-[36px] -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#dce4df] bg-white/95 px-3.5 text-xs font-semibold text-[#103d2c] shadow-md backdrop-blur-xs transition-colors hover:bg-[#f2f6f4] dark:border-slate-700 dark:bg-[#111A27]/95 dark:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#134a35] dark:text-[#E2B354]" />
          <span>Cari di area peta ini</span>
        </button>
      )}
    </div>
  );
};

interface NearbyMosquesViewProps {
  onBackHome: () => void;
}

export const NearbyMosquesView: React.FC<NearbyMosquesViewProps> = ({ onBackHome }) => {
  const envApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();

  const [apiKey, setApiKey] = useState<string>(envApiKey);
  const [configLoading, setConfigLoading] = useState<boolean>(!envApiKey);

  const [center, setCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const [userPosition, setUserPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [geoStatus, setGeoStatus] = useState<"requesting" | "granted" | "denied" | "manual">("requesting");
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState("");
  const [pendingManualQuery, setPendingManualQuery] = useState("");

  const [filter, setFilter] = useState<PlaceFilter>("all");
  const [radiusMeters, setRadiusMeters] = useState<number>(3000);
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);

  const [results, setResults] = useState<MosqueResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (envApiKey) return;
    let active = true;
    fetch("/api/maps-config", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { apiKey: "" }))
      .then((data: { apiKey?: string }) => {
        if (!active) return;
        setApiKey((data.apiKey || "").trim());
      })
      .catch(() => {
        // Fallback to external link UI
      })
      .finally(() => {
        if (active) setConfigLoading(false);
      });
    return () => {
      active = false;
    };
  }, [envApiKey]);

  const requestUserLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoLoading(false);
      setGeoStatus("denied");
      setGeoError("Perangkat atau peramban ini tidak mendukung deteksi lokasi GPS.");
      return;
    }
    setGeoLoading(true);
    setGeoStatus("requesting");
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPosition(nextPos);
        setCenter(nextPos);
        setLocationLabel("Lokasi Anda saat ini");
        setGeoStatus("granted");
        setPendingManualQuery("");
        setActiveQuery("");
        setSearchInput("");
        setSearchTrigger((t) => t + 1);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setGeoStatus("denied");
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            "Izin lokasi ditolak. Aktifkan izin lokasi atau ketik nama kota/kecamatan pada kolom pencarian di atas."
          );
        } else {
          setGeoError(
            "Lokasi GPS belum dapat dideteksi. Coba izinkan lagi atau ketik nama kota/kecamatan di kolom pencarian."
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  const handleManualAreaResolved = useCallback(
    (resolvedCenter: google.maps.LatLngLiteral, label: string) => {
      setCenter(resolvedCenter);
      setLocationLabel(label);
      setGeoStatus("manual");
      setGeoError("");
      setActiveQuery(pendingManualQuery);
      setPendingManualQuery("");
      setSearchTrigger((t) => t + 1);
    },
    [pendingManualQuery]
  );

  const handleManualAreaFailed = useCallback((msg: string) => {
    setGeoError(msg);
    setPendingManualQuery("");
  }, []);

  const handleStatusChange = useCallback((isLoading: boolean, nextError: string) => {
    setLoading(isLoading);
    setErrorMsg(nextError);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setGeoError("");
    if (!center) {
      setPendingManualQuery(trimmed);
    } else {
      setActiveQuery(trimmed);
      setSearchTrigger((t) => t + 1);
    }
  };

  const externalFallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    searchInput.trim() ? `${searchInput.trim()} masjid mushala` : "masjid mushala terdekat"
  )}`;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 pt-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8e4] pb-4 dark:border-slate-800">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
            Pencari Lokasi Ibadah
          </p>
          <h1 className="font-display mt-0.5 text-xl font-semibold text-[#103d2c] sm:text-2xl dark:text-white">
            Masjid &amp; Mushala Terdekat
          </h1>
          <p className="mt-0.5 text-xs text-[#5e6a62] dark:text-slate-300">
            Titik pusat:{" "}
            <strong className="text-[#103d2c] dark:text-white">
              {locationLabel ||
                (geoLoading ? "Mendeteksi lokasi GPS…" : "Menunggu izin lokasi atau pencarian wilayah")}
            </strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#dce4df] bg-white px-3 text-xs font-semibold text-[#174231] hover:bg-[#f2f6f4] dark:border-slate-700 dark:bg-[#111A27] dark:text-slate-200 dark:hover:bg-[#162233]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Beranda</span>
        </button>
      </div>

      {/* Location Consent + Filter Controls */}
      <div className="space-y-3 rounded-2xl border border-[#e2e8e4] bg-white p-3.5 shadow-xs sm:p-4 dark:border-slate-800 dark:bg-[#111A27]">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
            <label className="relative flex min-h-[40px] flex-1 items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#7c745f] dark:text-slate-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari masjid, mushala, atau nama kota/kecamatan…"
                aria-label="Cari masjid, mushala, atau wilayah"
                className="min-h-[40px] w-full rounded-xl border border-[#dce4df] bg-white pr-3 pl-9 text-xs text-[#1d2c24] outline-none focus:border-[#134a35] sm:text-sm dark:border-slate-700 dark:bg-[#162131] dark:text-slate-100 dark:focus:border-[#E2B354]"
              />
            </label>
            <button
              type="submit"
              className="min-h-[40px] shrink-0 rounded-xl bg-[#134a35] px-4 text-xs font-semibold text-white hover:bg-[#0e3928] dark:bg-[#E2B354] dark:text-[#0B111A]"
            >
              Cari
            </button>
          </form>

          <button
            type="button"
            onClick={requestUserLocation}
            disabled={geoLoading}
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-[#134a35] bg-[#ebf5ef] px-3.5 text-xs font-semibold text-[#134a35] transition-colors hover:bg-[#dceee3] disabled:opacity-60 dark:border-[#E2B354] dark:bg-[#1D2B3E] dark:text-[#E2B354]"
          >
            {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
            <span>{geoLoading ? "Mendeteksi…" : "Gunakan Lokasi Saya"}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="inline-flex rounded-xl border border-[#dce4df] bg-[#f4f7f5] p-0.5 dark:border-slate-700 dark:bg-[#162131]">
            {(
              [
                { id: "all", label: "Semua" },
                { id: "mosque", label: "Masjid" },
                { id: "mushala", label: "Mushala" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilter(opt.id)}
                className={`min-h-[32px] rounded-lg px-3 text-xs font-semibold transition-colors ${
                  filter === opt.id
                    ? "bg-[#134a35] text-white dark:bg-[#E2B354] dark:text-[#0B111A]"
                    : "text-[#354c3e] dark:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-1 rounded-xl border border-[#dce4df] bg-[#f4f7f5] p-0.5 dark:border-slate-700 dark:bg-[#162131]">
            {[1000, 3000, 5000].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadiusMeters(r)}
                className={`font-mono-tabular min-h-[32px] rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                  radiusMeters === r
                    ? "bg-[#134a35] text-white dark:bg-[#E2B354] dark:text-[#0B111A]"
                    : "text-[#354c3e] dark:text-slate-300"
                }`}
              >
                {r / 1000} km
              </button>
            ))}
          </div>
        </div>

        {geoError && (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300">{geoError}</p>
        )}
      </div>

      {/* Main Content */}
      {configLoading ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-[#e2e8e4] bg-white p-8 dark:border-slate-800 dark:bg-[#111A27]">
          <div className="flex items-center gap-2 text-sm text-[#5e6a62] dark:text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin text-[#134a35] dark:text-[#E2B354]" />
            <span>Menyiapkan peta Google Maps…</span>
          </div>
        </div>
      ) : !apiKey ? (
        <div className="rounded-2xl border border-[#e2e8e4] bg-white p-6 text-center shadow-xs dark:border-slate-800 dark:bg-[#111A27]">
          <MapPin className="mx-auto h-9 w-9 text-[#134a35] dark:text-[#E2B354]" />
          <h2 className="font-display mt-3 text-lg font-semibold text-[#103d2c] dark:text-white">
            Buka Pencarian di Google Maps
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-[#5e6a62] dark:text-slate-300">
            Peta interaktif memerlukan kunci Google Maps Platform. Anda tetap dapat langsung membuka
            pencarian masjid dan mushala melalui Google Maps.
          </p>
          <a
            href={externalFallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#134a35] px-5 text-xs font-semibold text-white hover:bg-[#0e3928] dark:bg-[#E2B354] dark:text-[#0B111A]"
          >
            <span>Buka di Google Maps</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      ) : (
        <APIProvider apiKey={apiKey} language="id" region="ID">
          {pendingManualQuery && (
            <ManualAreaResolver
              pendingManualQuery={pendingManualQuery}
              onResolved={handleManualAreaResolved}
              onFailed={handleManualAreaFailed}
            />
          )}

          {!center ? (
            <div className="rounded-2xl border border-[#e2e8e4] bg-white p-7 text-center shadow-xs dark:border-slate-800 dark:bg-[#111A27]">
              {geoLoading || pendingManualQuery ? (
                <div className="flex flex-col items-center justify-center gap-2.5 py-6">
                  <Loader2 className="h-7 w-7 animate-spin text-[#134a35] dark:text-[#E2B354]" />
                  <p className="text-sm font-medium text-[#103d2c] dark:text-white">
                    {pendingManualQuery
                      ? `Mencari area "${pendingManualQuery}"…`
                      : "Meminta izin lokasi perangkat Anda…"}
                  </p>
                  <p className="max-w-md text-xs text-[#5e6a62] dark:text-slate-400">
                    Izinkan akses lokasi agar kami dapat menampilkan masjid dan mushala terdekat di sekitar Anda.
                  </p>
                </div>
              ) : (
                <div className="mx-auto max-w-md py-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ebf5ef] text-[#134a35] dark:bg-[#18283B] dark:text-[#E2B354]">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h2 className="font-display mt-3 text-lg font-semibold text-[#103d2c] dark:text-white">
                    {geoStatus === "denied" ? "Izin Lokasi Belum Aktif" : "Tentukan Lokasi Terlebih Dahulu"}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#5e6a62] dark:text-slate-300">
                    Aplikasi tidak menampilkan lokasi default apabila GPS tidak diizinkan. Aktifkan
                    izin lokasi perangkat Anda atau ketik nama kota/kecamatan pada kolom pencarian di atas.
                  </p>
                  <button
                    type="button"
                    onClick={requestUserLocation}
                    className="mt-4 inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#134a35] px-5 text-xs font-semibold text-white hover:bg-[#0e3928] dark:bg-[#E2B354] dark:text-[#0B111A]"
                  >
                    <Compass className="h-4 w-4" />
                    <span>Minta Izin Lokasi (GPS)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7">
                <MapWorkspace
                  center={center}
                  userPosition={userPosition}
                  locationLabel={locationLabel}
                  filter={filter}
                  radiusMeters={radiusMeters}
                  searchQuery={activeQuery}
                  searchTrigger={searchTrigger}
                  onCenterChange={(next) => {
                    setCenter(next);
                    setLocationLabel("Area peta dipilih");
                    setSearchTrigger((t) => t + 1);
                  }}
                  onResultsChange={setResults}
                  selectedId={selectedId}
                  onSelectId={setSelectedId}
                  onStatusChange={handleStatusChange}
                />
              </div>

              <section
                aria-label="Daftar masjid dan mushala terdekat"
                className="flex max-h-[420px] flex-col rounded-2xl border border-[#e2e8e4] bg-white p-3.5 shadow-xs lg:col-span-5 dark:border-slate-800 dark:bg-[#111A27]"
              >
                <div className="flex items-center justify-between border-b border-[#e8eeea] pb-2.5 dark:border-slate-800">
                  <h2 className="text-sm font-semibold text-[#103d2c] dark:text-white">
                    Daftar Terdekat ({results.length})
                  </h2>
                  {loading && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#606c64] dark:text-slate-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Memuat…
                    </span>
                  )}
                </div>

                {errorMsg ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-red-700 dark:text-red-400">{errorMsg}</p>
                    <a
                      href={externalFallbackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#134a35] px-3.5 py-2 text-xs font-semibold text-white dark:bg-[#E2B354] dark:text-[#0B111A]"
                    >
                      <span>Cari di Google Maps</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : results.length === 0 && !loading ? (
                  <p className="py-8 text-center text-xs text-[#606c64] dark:text-slate-400">
                    Belum ada masjid atau mushala yang cocok pada radius {radiusMeters / 1000} km.
                    Coba perluas radius atau geser peta.
                  </p>
                ) : (
                  <div className="mt-2.5 flex-1 space-y-2 overflow-y-auto pr-1">
                    {results.map((item) => {
                      const isSelected = item.id === selectedId;
                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border p-3 transition-colors ${
                            isSelected
                              ? "border-[#134a35] bg-[#f2f8f4] dark:border-[#E2B354] dark:bg-[#18263A]"
                              : "border-[#e8eeea] bg-white hover:bg-[#f8fbf9] dark:border-slate-800 dark:bg-[#131D2B] dark:hover:bg-[#172334]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedId(item.id)}
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                      item.kind === "mushala"
                                        ? "bg-[#fbf5e6] text-[#8d6820] dark:bg-[#272011] dark:text-[#E2B354]"
                                        : "bg-[#ebf5ef] text-[#134a35] dark:bg-[#142b23] dark:text-[#74d6ab]"
                                    }`}
                                  >
                                    {item.kind === "mushala" ? "Mushala" : "Masjid"}
                                  </span>
                                  {typeof item.rating === "number" && (
                                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#7c745f] dark:text-slate-300">
                                      <Star className="h-3 w-3 fill-[#e2b354] text-[#e2b354]" />
                                      {item.rating.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                                <h3 className="mt-1 text-xs font-semibold text-[#103d2c] sm:text-sm dark:text-white">
                                  {item.name}
                                </h3>
                                <p className="mt-0.5 line-clamp-2 text-[11px] text-[#5e6a62] dark:text-slate-400">
                                  {item.address}
                                </p>
                              </div>
                              <span className="font-mono-tabular shrink-0 rounded-lg bg-[#eef4f0] px-2 py-1 text-[11px] font-semibold text-[#134a35] dark:bg-[#1D2B3E] dark:text-[#E2B354]">
                                {formatDistance(item.distanceMeters)}
                              </span>
                            </div>
                          </button>

                          {item.mapsUri && (
                            <div className="mt-2 flex justify-end border-t border-[#e8eeea] pt-2 dark:border-slate-800/80">
                              <a
                                href={item.mapsUri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#134a35] hover:underline dark:text-[#E2B354]"
                              >
                                <Navigation className="h-3 w-3" />
                                <span>Petunjuk Arah di Google Maps</span>
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </APIProvider>
      )}

      <FooterDisclaimer variant="compact" />
    </div>
  );
};
