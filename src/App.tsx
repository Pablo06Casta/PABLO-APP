import {
  lazy,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Building2,
  Check,
  ChevronRight,
  ClipboardCheck,
  Compass,
  Download,
  Earth,
  Fuel,
  Heart,
  HelpCircle,
  Home,
  Info,
  LayoutGrid,
  List,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Moon,
  Search as SearchIcon,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trees,
  Trophy,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import type {
  AirbnbQuote,
  Filters,
  FuelStation,
  Market,
  RecentSearch,
  Search,
  Stay,
  StayType,
  Theme,
  Town,
  Venue,
} from "./types";
import { normalize } from "./data/towns";
import {
  defaultVenue,
  venues,
  townForVenue,
  searchOrigin,
  venueLabel,
} from "./data/venues";
import { VenuePicker } from "./components/VenuePicker";
import { PlatformSearches } from "./components/PlatformSearches";
import { AirbnbSearchCard } from "./components/AirbnbSearchCard";
import {
  initialFilters,
  bookingUrl,
  isoDate,
  nights,
  filterStays,
} from "./lib/search";
import { readStorage, useStored } from "./lib/storage";
import { realStays, lodgingProvider } from "./services/lodging";
import { SearchBar } from "./components/SearchBar";
import { StayCard } from "./components/StayCard";
import { Dialog } from "./components/Dialog";
import { readTrip } from "./lib/trip";
import { LazyMap as MapView } from "./components/LazyMap";
import { ExternalServices } from "./components/ExternalServices";
import { ConsentBanner } from "./components/ConsentBanner";
import { track, useAnalyticsConsent } from "./lib/analytics";
import type { Tournament } from "./data/tournaments";
import "./App.css";

// Cada sección y diálogo se descarga al usarse por primera vez para que la
// primera carga en móviles solo incluya el listado de alojamientos.
const FiltersDialog = lazy(() =>
  import("./components/FiltersDialog").then((m) => ({ default: m.FiltersDialog })),
);
const DetailDialog = lazy(() =>
  import("./components/DetailDialog").then((m) => ({ default: m.DetailDialog })),
);
const CompareDialog = lazy(() =>
  import("./components/CompareDialog").then((m) => ({ default: m.CompareDialog })),
);
const TripDialog = lazy(() =>
  import("./components/TripDialog").then((m) => ({ default: m.TripDialog })),
);
const GroupBudgetSection = lazy(() =>
  import("./components/GroupBudgetSection").then((m) => ({
    default: m.GroupBudgetSection,
  })),
);
const TeamUtilitiesSection = lazy(() =>
  import("./components/TeamUtilitiesSection").then((m) => ({
    default: m.TeamUtilitiesSection,
  })),
);
const Markets = lazy(() =>
  import("./components/Markets").then((m) => ({ default: m.Markets })),
);
const FuelStations = lazy(() =>
  import("./components/FuelStations").then((m) => ({ default: m.FuelStations })),
);
const LegalInformation = lazy(() =>
  import("./components/LegalInformation").then((m) => ({
    default: m.LegalInformation,
  })),
);
const TournamentCalendar = lazy(() =>
  import("./components/TournamentCalendar").then((m) => ({
    default: m.TournamentCalendar,
  })),
);
// Supermercados, gasolineras y geocodificación solo se descargan al pedirlos.
const places = () => import("./services/places");
const sectionFallback = (
  <div className="section-loading" role="status">
    Cargando…
  </div>
);

type Selection = { stay: Stay; search: Search };
type Favorite = { stay: Stay; town: Town; venue?: Venue };
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const currentYear = new Date().getFullYear();
const fuelPriceComparator =
  "https://www.ocu.org/coches/gasolina-y-carburantes/calculadora/gasolineras";
const categories: Array<{ name: StayType; label: string; icon: typeof Home }> =
  [
    { name: "Todos", label: "Todos los alojamientos", icon: LayoutGrid },
    { name: "Apartamento", label: "Apartamentos", icon: Building2 },
    { name: "Hotel", label: "Hoteles", icon: BedDouble },
    { name: "Casa", label: "Casas", icon: Trees },
    { name: "Habitación", label: "Habitaciones", icon: Home },
  ];
function initialSearch(): Search {
  const fallback: Search = {
    town: townForVenue(defaultVenue),
    venue: defaultVenue,
    checkIn: isoDate(7),
    checkOut: isoDate(10),
    guests: 2,
  };
  const value = readStorage<boolean>("cerca-remember-search-v1", false)
    ? readStorage<Search>("cerca-search-v3", fallback)
    : fallback;
  if (value?.venue) value.venue = venues.find((v) => v.id === value.venue?.id);
  return value?.town?.name &&
    Number.isFinite(value.town.lat) &&
    value.checkIn >= isoDate(0) &&
    value.checkOut > value.checkIn &&
    value.guests >= 1 &&
    value.guests <= 8
    ? value
    : fallback;
}
function App() {
  const [photos, setPhotos] = useState(false);
  const [maps, setMaps] = useState(false);
  return (
    <ExternalServices.Provider value={{ photos, setPhotos, maps, setMaps }}>
      <AppContent />
    </ExternalServices.Provider>
  );
}
function AppContent() {
  const [sharedTrip] = useState(() => new URL(window.location.href).searchParams.get("trip"));
  const [restoredTrip] = useState(() => sharedTrip === null ? null : readTrip(sharedTrip));
  const [search, setSearch] = useState<Search>(() => restoredTrip?.search ?? initialSearch());
  const [stays, setStays] = useState<Stay[]>(() => realStays(search));
  const [filters, setFilters] = useState<Filters>({ ...initialFilters });
  const [sort, setSort] = useState("price");
  const [lodgingSource, setLodgingSource] = useState<"booking" | "airbnb">(
    "booking",
  );
  const [tab, setTab] = useState<
    "explore" | "map" | "tournaments" | "budget" | "utilities" | "favorites" | "settings"
  >("explore");
  const [modal, setModal] = useState<
    "filters" | "markets" | "fuel" | "help" | "privacy" | "compare" | "trip" | null
  >(null);
  const [detail, setDetail] = useState<Selection | null>(null);
  const [budgetOpened, setBudgetOpened] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useAnalyticsConsent();
  // El presupuesto se descarga al abrirlo y después se mantiene montado para
  // conservar lo escrito al cambiar de sección.
  if (tab === "budget" && !budgetOpened) setBudgetOpened(true);
  const [busy, setBusy] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [marketTownId, setMarketTownId] = useState("");
  const [marketStatus, setMarketStatus] = useState("idle");
  const [marketError, setMarketError] = useState("");
  const marketController = useRef<AbortController | null>(null);
  const [fuelStations, setFuelStations] = useState<FuelStation[]>([]);
  const [fuelOriginId, setFuelOriginId] = useState("");
  const [fuelStatus, setFuelStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [fuelError, setFuelError] = useState("");
  const fuelController = useRef<AbortController | null>(null);
  const searchGeneration = useRef(0);
  const [favorites, setFavorites] = useStored<Favorite[]>(
    "cerca-favorites-v2",
    [],
    (items) =>
      Array.isArray(items)
        ? items.filter((entry) => entry.stay?.platform !== "Airbnb")
        : [],
  );
  const [rememberSearch, setRememberSearch] = useState(() =>
    readStorage<boolean>("cerca-remember-search-v1", false),
  );
  const [recent, setRecent] = useState<RecentSearch[]>(() =>
    rememberSearch ? readStorage<RecentSearch[]>("cerca-recent-v1", []) : [],
  );
  const { photos, setPhotos, maps, setMaps } = useContext(ExternalServices);
  const [theme, setTheme] = useStored<Theme>("cerca-theme-v1", "system");
  const [compare, setCompare] = useState<Selection[]>(() => restoredTrip?.search ? restoredTrip.stays.map((stay) => ({ stay, search: restoredTrip.search! })) : []);
  const [airbnbQuote, setAirbnbQuote] = useState<AirbnbQuote | null>(null);
  const currentStayIds = useMemo(() => new Set(realStays(search).map((stay) => stay.id)), [search]);
  const shareableCompare = compare.filter((entry) => currentStayIds.has(entry.stay.id));
  const [tripWarning, setTripWarning] = useState(restoredTrip?.warning ?? "");
  const restoredSearch = useRef(Boolean(restoredTrip?.search));
  const [toast, setToast] = useState("");
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(
    null,
  );

  useEffect(() => {
    if (restoredSearch.current) return;
    try {
      if (rememberSearch) {
        localStorage.setItem("cerca-remember-search-v1", "true");
        localStorage.setItem("cerca-search-v3", JSON.stringify(search));
        localStorage.setItem("cerca-recent-v1", JSON.stringify(recent));
      } else {
        localStorage.removeItem("cerca-remember-search-v1");
        localStorage.removeItem("cerca-search-v3");
        localStorage.removeItem("cerca-recent-v1");
      }
    } catch {
      /* Almacenamiento opcional */
    }
  }, [search, rememberSearch, recent]);
  useEffect(() => {
    // Retira anuncios de terceros conservados por versiones anteriores.
    try {
      const stored = readStorage<Favorite[]>("cerca-favorites-v2", []);
      if (
        Array.isArray(stored) &&
        stored.some((item) => item.stay?.platform === "Airbnb")
      ) {
        if (favorites.length)
          localStorage.setItem("cerca-favorites-v2", JSON.stringify(favorites));
        else localStorage.removeItem("cerca-favorites-v2");
      }
      localStorage.removeItem("cerca-favorites-v1");
    } catch {
      /* Almacenamiento opcional */
    }
  }, [favorites]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);
  useEffect(() => {
    track("section", tab);
  }, [tab, analyticsConsent]);
  useEffect(() => {
    if (modal) track("feature", modal);
  }, [modal]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const origin = searchOrigin(search);
  const currentMarkets = useMemo(
    () => (marketTownId === origin.id ? markets : []),
    [marketTownId, origin.id, markets],
  );
  const visible = useMemo(
    () => filterStays(stays, search, filters, currentMarkets, sort),
    [stays, search, filters, currentMarkets, sort],
  );
  const activeFilterCount = [
    "platform",
    "minPrice",
    "maxPrice",
    "maxDistance",
    "minRating",
    "cancellation",
    "parking",
    "kitchen",
    "marketDistance",
  ].filter(
    (key) =>
      filters[key as keyof Filters] !== initialFilters[key as keyof Filters],
  ).length;
  const isSaved = (id: string) =>
    favorites.some((entry) => entry.stay.id === id);
  const isCompared = (id: string) =>
    compare.some((entry) => entry.stay.id === id);

  async function runSearch(next: Search) {
    restoredSearch.current = false;
    setTripWarning("");
    const sameCity = (v: Venue) =>
      normalize(v.city) === normalize(next.town.name);
    const venue =
      next.venue && sameCity(next.venue)
        ? next.venue
        : normalize(next.town.name) === normalize(search.town.name) &&
            search.venue
          ? search.venue
          : venues.find((v) => sameCity(v) && v.location);
    next = { ...next, venue };

    const generation = ++searchGeneration.current;
    marketController.current?.abort();
    marketController.current = null;
    fuelController.current?.abort();
    fuelController.current = null;
    setFuelStations([]);
    setFuelOriginId("");
    setFuelStatus("idle");
    setFuelError("");
    setMarketStatus("idle");
    setMarketError("");
    setMarkets([]);
    setMarketTownId("");
    setBusy(true);
    setSearchError("");
    setTab("explore");
    setCompare([]);
    setAirbnbQuote(null);
    if (!next.venue && next.town.approximate) {
      try {
        const matches = await (await places()).findTown(
          next.town.name + ", " + next.town.region,
          AbortSignal.timeout(5000),
        );
        if (matches[0])
          next = { ...next, town: { ...matches[0], id: next.town.id } };
      } catch {
        /* Conservamos la referencia municipal y la identificamos como aproximada. */
      }
    }
    if (generation !== searchGeneration.current) return;
    setSearch(next);
    track("destination", next.venue?.id ?? next.town.id);
    setRecent((items) =>
      [
        { town: next.town, date: new Date().toISOString() },
        ...items.filter((item) => item.town.id !== next.town.id),
      ].slice(0, 5),
    );
    try {
      const result = await lodgingProvider.search(next);
      if (generation === searchGeneration.current) setStays(result);
    } catch {
      if (generation === searchGeneration.current) {
        setStays([]);
        setSearchError(
          "La búsqueda no se ha podido completar. Vuelve a intentarlo.",
        );
      }
    } finally {
      if (generation === searchGeneration.current) setBusy(false);
    }
  }
  function toggleFavorite(stay: Stay, query = search) {
    const saved = isSaved(stay.id);
    setFavorites(
      saved
        ? favorites.filter((entry) => entry.stay.id !== stay.id)
        : [...favorites, { stay, town: query.town, venue: query.venue }],
    );
    if (!saved) track("feature", "favorite_add");
    setToast(
      saved
        ? "Alojamiento eliminado de favoritos"
        : "Guardado en tus favoritos",
    );
  }
  function toggleCompare(stay: Stay, query = search) {
    if (isCompared(stay.id)) {
      setCompare(compare.filter((entry) => entry.stay.id !== stay.id));
      return;
    }
    if (compare.length === 3) {
      setToast(
        "Puedes comparar hasta 3 alojamientos. Quita uno para añadir otro.",
      );
      return;
    }
    setCompare([...compare, { stay, search: query }]);
    track("feature", "compare_add");
  }
  async function loadMarkets(query = search) {
    const town = searchOrigin(query);
    const previousMarkets = marketTownId === town.id ? markets : [];
    marketController.current?.abort();
    if (query.venue && !query.venue.location) {
      marketController.current = null;
      setMarkets([]);
      setMarketTownId(town.id);
      setMarketStatus("error");
      setMarketError(
        "Primero hay que confirmar la ubicación de este pabellón.",
      );
      return;
    }
    const controller = new AbortController();
    marketController.current = controller;
    setMarketStatus("loading");
    setMarketError("");
    if (marketTownId !== town.id) setMarkets([]);
    setMarketTownId(town.id);
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const result = await (await places()).findMarkets(
        town,
        controller.signal,
        marketStatus === "success" && marketTownId === town.id,
      );
      if (marketController.current === controller) {
        setMarkets(result);
        setMarketStatus("success");
      }
    } catch (error) {
      if (marketController.current !== controller) return;
      if (
        controller.signal.aborted &&
        !controller.signal.reason?.name?.includes("Timeout")
      ) {
        setMarketError(
          "La consulta ha tardado demasiado. Vuelve a intentarlo.",
        );
      } else
        setMarketError(
          error instanceof Error &&
            !(error instanceof TypeError) &&
            !(error instanceof SyntaxError)
            ? error.message
            : "No podemos conectar con OpenStreetMap en este momento. Comprueba tu conexión o vuelve a intentarlo.",
        );
      if (previousMarkets.length) {
        setMarkets(previousMarkets);
        setMarketStatus("success");
        setMarketError(
          "No se pudo actualizar. Puedes seguir usando los datos guardados y su fecha de consulta.",
        );
      } else setMarketStatus("error");
    } finally {
      clearTimeout(timeout);
    }
  }
  function openDetail(stay: Stay, query = search) {
    setModal(null);
    setDetail({ stay, search: query });
    track("feature", "detail");
    if (marketTownId !== searchOrigin(query).id) {
      void loadMarkets(query);
    }
  }
  function showMarkets() {
    setModal("markets");
    if (marketStatus === "idle" || marketTownId !== origin.id)
      void loadMarkets(search);
  }
  async function loadFuel(query = search) {
    const place = searchOrigin(query);
    const previous = fuelOriginId === place.id ? fuelStations : [];
    fuelController.current?.abort();
    if (query.venue && !query.venue.location) {
      setFuelStations([]);
      setFuelOriginId(place.id);
      setFuelStatus("error");
      setFuelError("Primero hay que confirmar la ubicación de este pabellón.");
      return;
    }
    const controller = new AbortController();
    fuelController.current = controller;
    track("feature", "fuel_search");
    setFuelStatus("loading");
    setFuelError("");
    if (fuelOriginId !== place.id) setFuelStations([]);
    setFuelOriginId(place.id);
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const found = await (await places()).findFuelStations(place, controller.signal, fuelStatus === "success" && fuelOriginId === place.id);
      if (fuelController.current === controller) {
        setFuelStations(found);
        setFuelStatus("success");
      }
    } catch (cause) {
      if (fuelController.current !== controller) return;
      setFuelError(cause instanceof Error && !controller.signal.aborted ? cause.message : "La consulta ha tardado demasiado. Vuelve a intentarlo.");
      if (previous.length) {
        setFuelStations(previous);
        setFuelStatus("success");
        setFuelError("No se pudo actualizar. Puedes seguir consultando los resultados anteriores.");
      } else setFuelStatus("error");
    } finally {
      clearTimeout(timeout);
    }
  }
  function showFuel() {
    setModal("fuel");
  }
  function card(stay: Stay, query = search) {
    return (
      <StayCard
        key={stay.id}
        stay={stay}
        search={query}
        markets={marketTownId === searchOrigin(query).id ? markets : []}
        saved={isSaved(stay.id)}
        compared={isCompared(stay.id)}
        onFavorite={() => toggleFavorite(stay, query)}
        onCompare={() => toggleCompare(stay, query)}
        onOpen={() => openDetail(stay, query)}
      />
    );
  }
  const tabs = [
    { id: "explore" as const, label: "Explorar", icon: Compass },
    { id: "map" as const, label: "Mapa", icon: MapIcon },
    { id: "tournaments" as const, label: "Torneos", icon: Trophy },
    { id: "budget" as const, label: "Presupuesto", icon: Wallet },
    { id: "utilities" as const, label: "Utilidades", icon: ClipboardCheck },
    { id: "favorites" as const, label: "Favoritos", icon: Heart },
  ];
  return (
    <div
      className={`cerca-app ${compare.length || airbnbQuote ? "has-comparison" : ""}`}
    >
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a
            className="brand"
            href="#explorar"
            onClick={(event) => {
              event.preventDefault();
              setTab("explore");
            }}
            aria-label="CERCA, inicio"
          >
            <span className="brand-symbol">
              <MapPin size={25} strokeWidth={2.4} />
            </span>
            <span>
              cerca<span className="brand-dot">.</span>
            </span>
          </a>
          <nav className="desktop-nav" aria-label="Navegación principal">
            <button
              className={tab === "explore" || tab === "map" ? "active" : ""}
              onClick={() => setTab("explore")}
            >
              Alojamientos
            </button>
            <button
              className={tab === "tournaments" ? "active" : ""}
              onClick={() => setTab("tournaments")}
            >
              Torneos
            </button>
            <button
              className={tab === "budget" ? "active" : ""}
              onClick={() => setTab("budget")}
            >
              Presupuesto del grupo
            </button>
            <button
              className={tab === "utilities" ? "active" : ""}
              onClick={() => setTab("utilities")}
            >
              Utilidades
            </button>
            <button onClick={showMarkets}>
              Supermercados cerca
            </button>
            <button onClick={showFuel}>Gasolineras cerca</button>
            <button
              className={tab === "favorites" ? "active" : ""}
              onClick={() => setTab("favorites")}
            >
              Favoritos{" "}
              {favorites.length > 0 && (
                <span className="nav-count">{favorites.length}</span>
              )}
            </button>
          </nav>
          <div className="header-actions">
            <span className="header-country">
              <Earth size={15} /> España · EUR
            </span>
            <button
              className="icon-button help-button"
              aria-label="Cómo funciona CERCA"
              onClick={() => setModal("help")}
            >
              <HelpCircle size={20} />
            </button>
            <button
              className="profile-button"
              aria-label="Abrir ajustes"
              onClick={() => setTab("settings")}
            >
              <UserRound size={18} />
              <span>Tu espacio</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="main-container">
        {budgetOpened && (
          <div hidden={tab !== "budget"}>
            <Suspense fallback={sectionFallback}>
              <GroupBudgetSection
                search={search}
                stays={shareableCompare.map((entry) => entry.stay)}
              />
            </Suspense>
          </div>
        )}
        {(tab === "explore" || tab === "map") && (
          <>
            <section className="hero" aria-labelledby="main-title">
              <div className="hero-eyebrow">
                <span className="eyebrow-line" />
                <Sparkles size={13} /> MENOS DESPLAZAMIENTOS. MÁS BÁDMINTON.
                <span className="eyebrow-line" />
              </div>
              <h1 id="main-title">
                Tu torneo, <span>todo cerca.</span>
              </h1>
              <p>
                Alojamientos para tu equipo, supermercados y gasolineras junto al pabellón.
                Compara presupuestos y reserva en la plataforma.
              </p>
              {tripWarning && <p className="trip-warning" role="alert">{tripWarning}</p>}
              {restoredTrip?.search && !tripWarning && <p className="trip-warning" role="status">Viaje compartido recuperado. Cualquier persona con este enlace puede ver el pabellón, fechas, viajeros y alojamientos seleccionados.</p>}
              <VenuePicker
                search={search}
                onSelect={(venue) =>
                  runSearch({ ...search, town: townForVenue(venue), venue })
                }
              />
              <SearchBar
                key={`${search.town.id}-${search.checkIn}-${search.checkOut}-${search.guests}`}
                search={search}
                busy={busy}
                onSearch={runSearch}
              />
              <div className="trip-actions hero-trip-actions">
                <button className="secondary-button" onClick={() => setModal("trip")}>Compartir viaje</button>
                <button className="secondary-button" onClick={showFuel}><Fuel size={16} /> Buscar gasolineras cerca</button>
                <a
                  className="secondary-button"
                  href={fuelPriceComparator}
                  target="_blank"
                  rel="noreferrer"
                >
                  Comparar precios gasolina <ArrowUpRight size={16} />
                </a>
              </div>
              <div className="quick-destinations">
                <span>
                  {recent.length
                    ? "Vuelve a explorar:"
                    : "Un poco de inspiración:"}
                </span>
                {venues
                  .filter((v) => v.location)
                  .filter(
                    (v, index, all) =>
                      all.findIndex((x) => x.city === v.city) === index,
                  )
                  .slice(0, 4)
                  .map((venue) => (
                    <button
                      key={venue.id}
                      onClick={() =>
                        runSearch({
                          ...search,
                          town: townForVenue(venue),
                          venue,
                        })
                      }
                    >
                      <MapPin size={12} />
                      {venue.city}
                      <ArrowUpRight size={12} />
                    </button>
                  ))}
              </div>
            </section>
            <section className="browse-section" aria-label="Alojamientos">
              <div className="category-toolbar">
                <div
                  className="category-tabs"
                  role="group"
                  aria-label="Tipo de alojamiento"
                >
                  {categories.map(({ name, label, icon: Icon }) => (
                    <button
                      key={name}
                      className={filters.type === name ? "active" : ""}
                      onClick={() => setFilters({ ...filters, type: name })}
                      aria-pressed={filters.type === name}
                    >
                      <Icon size={22} strokeWidth={1.5} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="filter-button"
                  onClick={() => setModal("filters")}
                >
                  <SlidersHorizontal size={17} /> Filtros
                  {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
                </button>
              </div>
              <div className="quick-filters">
                <span className="quick-filters-note">
                  <Wallet size={14} /> Hasta {filters.maxPrice} € / persona y
                  noche · estimación
                </span>
                <button onClick={() => setModal("filters")}>
                  <LocateFixed size={14} /> A menos de {filters.maxDistance} km
                  del {search.venue ? "pabellón" : "centro"}
                </button>
                <span className="quick-filters-note">
                  <Check size={13} /> Tu escapada, a tu medida
                </span>
              </div>
              <div className="results-heading">
                <div>
                  <p className="small-caps">DESCUBRE TU PRÓXIMO RINCÓN</p>
                  <h2>
                    Quédate en {search.town.name}
                    <span className="heading-dot">.</span>
                  </h2>
                  <p>
                    {lodgingSource === "booking" ? (
                      <>
                        {visible.length} alojamientos de Booking y acceso a
                        Airbnb
                      </>
                    ) : (
                      <>Buscar alojamientos en Airbnb</>
                    )}{" "}
                    <span>·</span> {nights(search)} noches <span>·</span>{" "}
                    {search.guests}{" "}
                    {search.guests === 1 ? "huésped" : "huéspedes"}
                  </p>
                  {lodgingSource === "booking" &&
                    visible.some((stay) => stay.bookingSearch) && (
                    <p className="catalogue-coverage">
                      {visible.filter((stay) => !stay.bookingSearch).length}{" "}
                      enlaces directos
                      {" · "}
                      {visible.filter((stay) => stay.bookingSearch).length}{" "}
                      alojamientos para buscar en Booking
                    </p>
                  )}
                  {lodgingSource === "airbnb" && (
                    <p className="catalogue-coverage">
                      Los anuncios, la disponibilidad y el precio final se
                      consultan directamente en Airbnb.
                    </p>
                  )}
                </div>
                <div className="results-actions">
                  <span className="lodging-source-label">
                    Ver alojamientos de
                  </span>
                  <div
                    className="lodging-source-toggle"
                    role="group"
                    aria-label="Fuente de alojamientos"
                  >
                    <button
                      className={lodgingSource === "booking" ? "active" : ""}
                      onClick={() => setLodgingSource("booking")}
                      aria-pressed={lodgingSource === "booking"}
                    >
                      Booking
                    </button>
                    <button
                      className={lodgingSource === "airbnb" ? "active" : ""}
                      onClick={() => {
                        setLodgingSource("airbnb");
                        setTab("explore");
                      }}
                      aria-pressed={lodgingSource === "airbnb"}
                    >
                      Airbnb
                    </button>
                  </div>
                  {lodgingSource === "booking" && (
                    <div className="results-controls">
                      <label className="sort-select">
                        <ArrowDownUp size={15} />
                        <span className="sr-only">Ordenar alojamientos</span>
                        <select
                          aria-label="Ordenar alojamientos"
                          value={sort}
                          onChange={(event) => setSort(event.target.value)}
                        >
                          <option value="price">
                            Menor precio estimado por persona
                          </option>
                          <option value="recommended">
                            Con fotografía primero
                          </option>
                          <option value="name">Nombre del alojamiento</option>
                          <option value="distance">
                            Más cerca del {search.venue ? "pabellón" : "centro"}
                          </option>
                        </select>
                      </label>
                      <div className="view-toggle">
                        <button
                          className={tab === "explore" ? "active" : ""}
                          onClick={() => setTab("explore")}
                          aria-pressed={tab === "explore"}
                        >
                          <List size={15} />
                          <span>Lista</span>
                        </button>
                        <button
                          className={tab === "map" ? "active" : ""}
                          onClick={() => setTab("map")}
                          aria-pressed={tab === "map"}
                        >
                          <MapIcon size={15} />
                          <span>Mapa</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="demo-notice">
                <span>
                  <Info size={16} />
                  <span>
                    <strong>Precios orientativos, alojamientos reales.</strong>{" "}
                    Estimaciones de planificación, no ofertas confirmadas. CERCA
                    calcula un presupuesto propio sin consultar tarifas actuales
                    de Booking o Airbnb. No acredita disponibilidad ni cuál es
                    el alojamiento más barato. Extras no incluidos.
                  </span>
                </span>
                <button onClick={() => setModal("help")}>
                  Saber más <ArrowUpRight size={13} />
                </button>
              </div>
              {lodgingSource === "booking" && (
                <PlatformSearches search={search} />
              )}
              {search.town.approximate && !search.venue && (
                <p className="coordinate-notice">
                  El centro de {search.town.name} es aproximado (centroide
                  municipal). Las distancias se calculan respecto a ese punto.
                </p>
              )}
              {lodgingSource === "airbnb" ? (
                <div className="airbnb-results">
                  <AirbnbSearchCard
                    search={search}
                    onCompare={() => setModal("compare")}
                  />
                </div>
              ) : busy ? (
                <div
                  className="stays-grid"
                  aria-label="Cargando alojamientos"
                  role="status"
                >
                  {Array.from({ length: 8 }, (_, index) => (
                    <div className="skeleton-card" key={index}>
                      <div className="skeleton" />
                      <i className="skeleton" />
                      <i className="skeleton" />
                    </div>
                  ))}
                </div>
              ) : searchError ? (
                <div className="empty-state">
                  <SearchIcon size={35} />
                  <h3>No se pudo completar la búsqueda</h3>
                  <p>{searchError}</p>
                  <button
                    className="primary-button"
                    onClick={() => runSearch(search)}
                  >
                    Volver a buscar
                  </button>
                </div>
              ) : visible.length === 0 ? (
                <div className="empty-state">
                  <SearchIcon size={35} />
                  <h3>Un pequeño cambio puede abrir más puertas</h3>
                  <p>
                    No hay fichas del catálogo que encajen con este presupuesto,
                    estancia y distancia al pabellón. Puedes ampliar los filtros
                    o consultar las búsquedas de plataforma. Algunos destinos
                    aún no tienen fichas importadas de ambas plataformas.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setFilters({ ...initialFilters })}
                  >
                    Restablecer filtros
                  </button>
                  <a
                    className="secondary-button"
                    href={bookingUrl(search, "Booking")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Buscar más alojamientos en Booking{" "}
                    <ArrowUpRight size={15} />
                  </a>
                  <a
                    className="secondary-button"
                    href={bookingUrl(search, "Airbnb")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver alojamientos en Airbnb <ArrowUpRight size={15} />
                  </a>
                </div>
              ) : tab === "map" ? (
                <div className="map-results">
                  <div className="map-list">
                    {visible.map((stay) => card(stay))}
                  </div>
                  <div className="map-results-panel">
                    <MapView
                      stays={visible}
                      search={search}
                      markets={currentMarkets}
                      onOpen={(stay) => openDetail(stay)}
                    />
                    <button
                      className="map-markets-toggle secondary-button"
                      onClick={() => loadMarkets(search)}
                      disabled={marketStatus === "loading"}
                    >
                      <ShoppingBasket size={16} />
                      {marketStatus === "loading"
                        ? "Buscando supermercados…"
                        : "Añadir supermercados reales"}
                    </button>
                    {marketStatus === "error" && (
                      <p className="map-service-error">
                        No se pudieron consultar los supermercados. Puedes
                        volver a intentarlo.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="stays-grid">
                  <AirbnbSearchCard
                    search={search}
                    onCompare={() => setModal("compare")}
                  />
                  {visible.map((stay) => card(stay))}
                </div>
              )}
              <div className="results-end">
                <span />
                <p>Pequeños lugares. Grandes escapadas.</p>
                <span />
              </div>
            </section>
            <section className="supermarket-banner">
              <div className="basket-illustration" aria-hidden="true">
                <div className="basket-orbit" />
                <ShoppingBasket size={64} strokeWidth={1.1} />
                <span className="basket-leaf">✓</span>
              </div>
              <div className="supermarket-banner-copy">
                <span className="small-caps">SIÉNTETE UN POCO MÁS EN CASA</span>
                <h2>La compra, a un paseo.</h2>
                <p>
                  Descubre supermercados reales cerca del pabellón.
                  <br className="desktop-break" /> Lo esencial, sin dar vueltas.
                </p>
              </div>
              <div className="nearby-actions">
                <button className="primary-button" onClick={showMarkets}>Explorar supermercados <ArrowRight size={17} /></button>
                <button className="secondary-button" onClick={showFuel}><Fuel size={17} /> Buscar gasolineras</button>
              </div>
            </section>
            <section className="benefits" aria-label="Por qué CERCA">
              <div>
                <span>
                  <Wallet size={23} />
                </span>
                <div>
                  <h3>Tu presupuesto primero</h3>
                  <p>Compara presupuestos orientativos para tu equipo.</p>
                </div>
              </div>
              <div>
                <span>
                  <ShoppingBasket size={23} />
                </span>
                <div>
                  <h3>Todo lo que necesitas, cerca</h3>
                  <p>La estancia y la compra, en el mismo mapa.</p>
                </div>
              </div>
              <div>
                <span>
                  <Heart size={23} />
                </span>
                <div>
                  <h3>Guarda ese «aquí me quedo»</h3>
                  <p>Tus rincones favoritos, siempre a mano.</p>
                </div>
              </div>
            </section>
          </>
        )}

        {tab === "tournaments" && (
          <Suspense fallback={sectionFallback}>
          <TournamentCalendar
            search={search}
            onPlan={(
              _event: Tournament,
              venue: Venue,
              { checkIn, checkOut },
            ) => {
              track("tournament_plan", venue.id);
              void runSearch({
                town: townForVenue(venue),
                venue,
                checkIn,
                checkOut,
                guests: search.guests,
              });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
          </Suspense>
        )}
        {tab === "utilities" && (
          <Suspense fallback={sectionFallback}>
            <TeamUtilitiesSection search={search} />
          </Suspense>
        )}
        {tab === "favorites" && (
          <section className="saved-page">
            <div className="page-eyebrow">
              <Heart size={17} /> TU PRÓXIMA ESCAPADA EMPIEZA AQUÍ
            </div>
            <h1>
              Esos lugares que <span>te guardas.</span>
            </h1>
            <p className="page-description">
              Tus favoritos, juntos. Para cuando llegue el momento de hacer la
              maleta.
            </p>
            {favorites.length ? (
              <>
                <div className="saved-count">
                  {favorites.length} alojamientos guardados{" "}
                  <span>· Alojamientos reales</span>
                </div>
                <div className="stays-grid">
                  {favorites.map((entry) =>
                    card(entry.stay, {
                      ...search,
                      town: entry.town,
                      venue: entry.venue,
                    }),
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state favorites-empty">
                <span className="empty-icon">
                  <Heart size={32} />
                </span>
                <h2>Aquí empieza tu lista de deseos</h2>
                <p>
                  Toca el corazón de un alojamiento y lo encontrarás aquí.
                  <br />
                  Los favoritos se guardan en este navegador.
                </p>
                <button
                  className="primary-button"
                  onClick={() => setTab("explore")}
                >
                  Encontrar mi próximo rincón <ArrowRight size={17} />
                </button>
              </div>
            )}
          </section>
        )}

        {tab === "settings" && (
          <section className="settings-page">
            <p className="page-eyebrow">
              <Settings size={17} /> A TU MANERA
            </p>
            <h1>
              Tu espacio<span className="heading-dot">.</span>
            </h1>
            <p className="page-description">
              Los pequeños ajustes que hacen que todo encaje contigo.
            </p>
            <div className="settings-layout">
              <div className="settings-card">
                <h2>Un poco más tú</h2>
                <section>
                  <h3>Apariencia</h3>
                  <p>Elige cómo quieres ver CERCA.</p>
                  <div className="theme-picker">
                    {(
                      [
                        { id: "light", label: "Claro", icon: Sun },
                        { id: "dark", label: "Oscuro", icon: Moon },
                        { id: "system", label: "Sistema", icon: Settings },
                      ] as const
                    ).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        className={theme === id ? "selected" : ""}
                        aria-pressed={theme === id}
                        onClick={() => setTheme(id)}
                      >
                        <Icon size={23} />
                        {label}
                        {theme === id && <Check size={13} />}
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <h3>
                    <Download size={18} /> Lleva CERCA contigo
                  </h3>
                  <p>
                    Instala la aplicación para abrirla desde la pantalla de
                    inicio.
                  </p>
                  {installPrompt ? (
                    <button
                      className="primary-button"
                      onClick={async () => {
                        await installPrompt.prompt();
                        await installPrompt.userChoice;
                        setInstallPrompt(null);
                      }}
                    >
                      <Download size={16} /> Instalar CERCA
                    </button>
                  ) : (
                    <div className="install-instructions">
                      <strong>En iPhone, desde Safari</strong>
                      <p>
                        Pulsa Compartir <ArrowUpRight size={13} /> y después
                        «Añadir a pantalla de inicio». En otros navegadores,
                        busca «Instalar aplicación» en el menú.
                      </p>
                    </div>
                  )}
                </section>
                <section>
                  <h3>Moneda e idioma</h3>
                  <p>Español · Euro (EUR €) · Alojamientos en España.</p>
                </section>
              </div>
              <div>
                <div className="settings-card">
                  <h2>
                    <ShieldCheck size={21} /> Tu privacidad, primero
                  </h2>
                  <p>
                    Los favoritos y la apariencia se guardan cuando los eliges.
                    Recordar búsquedas es opcional. Sin cookies, anuncios ni
                    perfiles; la estadística de uso anónima solo se activa si la
                    aceptas.
                  </p>
                  <p>
                    La ubicación solo se consulta cuando la solicitas y
                    autorizas. Se envía a OpenStreetMap para encontrar la
                    localidad.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => setModal("privacy")}
                  >
                    Cómo tratamos tus datos <ChevronRight size={15} />
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => setModal("privacy")}
                  >
                    Gestionar datos guardados
                  </button>
                </div>
                <div className="settings-card about-card">
                  <span className="brand">
                    <MapPin size={24} />
                    cerca.
                  </span>
                  <p>Menos buscar. Más disfrutar.</p>
                  <span className="version-badge">
                    BÁDMINTON · PROYECTO INDEPENDIENTE
                  </span>
                  <button
                    className="text-button"
                    onClick={() => setModal("help")}
                  >
                    Cómo funciona <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div>
          <a
            className="footer-brand"
            href="#explorar"
            onClick={(event) => {
              event.preventDefault();
              setTab("explore");
            }}
          >
            <MapPin size={16} />
            cerca.
          </a>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            Alojamientos y comercios: © OpenStreetMap contributors
          </a>
        </div>
        <p className="independence-notice">
          CERCA es un proyecto personal de Pablo, sin ingresos ni afiliación con
          Booking.com o Airbnb. Las reservas se realizan en sus plataformas.
        </p>
        <nav aria-label="Información">
          <button onClick={() => setModal("help")}>Sobre CERCA</button>
          <span>·</span>
          <button onClick={() => setModal("privacy")}>
            Privacidad y licencias
          </button>
          <span>·</span>
          <span>© {currentYear} CERCA</span>
        </nav>
      </footer>
      <nav className="bottom-nav" aria-label="Navegación inferior">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => {
              setTab(id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <span>
              <Icon size={22} strokeWidth={tab === id ? 2 : 1.6} />
              {id === "favorites" && favorites.length > 0 && (
                <i>{favorites.length}</i>
              )}
            </span>
            {label}
          </button>
        ))}
      </nav>
      {(compare.length > 0 || airbnbQuote) && (
        <div className="compare-bar">
          <div className="compare-thumbnails">
            {compare.map(({ stay }) => (
              <img
                key={stay.id}
                src={stay.images[0]}
                alt="Alojamiento elegido"
              />
            ))}
            {airbnbQuote && (
              <span className="compare-airbnb-thumb" aria-hidden="true">
                A
              </span>
            )}
          </div>
          <span>
            <strong>{compare.length} de 3</strong> Booking
            {airbnbQuote && (
              <>
                {" · "}<i>Airbnb añadido</i>
              </>
            )}
          </span>
          <button
            className="primary-button"
            onClick={() => setModal("compare")}
          >
            Comparar <ArrowRight size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Vaciar comparación"
            onClick={() => {
              setCompare([]);
              setAirbnbQuote(null);
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button aria-label="Cerrar aviso" onClick={() => setToast("")}>
            <X size={15} />
          </button>
        </div>
      )}

      <Suspense fallback={null}>
      {modal === "filters" && (
        <FiltersDialog
          filters={filters}
          nearVenue={Boolean(search.venue)}
          onClose={() => setModal(null)}
          onApply={(next) => {
            setFilters(next);
            setModal(null);
          }}
          hasMarkets={currentMarkets.length > 0}
          loadMarkets={() => loadMarkets(search)}
          marketsLoading={marketStatus === "loading"}
          marketError={marketStatus === "error" ? marketError : ""}
        />
      )}
      {modal === "trip" && <TripDialog search={search} stays={shareableCompare.map((entry) => entry.stay)} omitted={compare.length - shareableCompare.length} onClose={() => setModal(null)} />}
      {modal === "markets" && (
        <Dialog
          title={`Supermercados cerca de ${venueLabel(search)}`}
          onClose={() => setModal(null)}
          wide
        >
          <div className="markets-dialog-content">
            <p className="muted">
              Establecimientos reales ordenados por proximidad a{" "}
              {venueLabel(search)}. Las distancias son aproximadas en línea
              recta.
            </p>
            <Suspense fallback={sectionFallback}>
            <Markets
              markets={marketTownId === origin.id ? markets : []}
              origin={origin}
              status={marketStatus}
              error={marketError}
              onLoad={() => loadMarkets(search)}
            />
            </Suspense>
          </div>
        </Dialog>
      )}
      {modal === "fuel" && <Dialog title={`Gasolineras cerca de ${venueLabel(search)}`} onClose={() => setModal(null)} wide>
        <div className="markets-dialog-content">
          <Suspense fallback={sectionFallback}>
          <FuelStations
            stations={fuelOriginId === origin.id ? fuelStations : []}
            origin={origin}
            destination={search.town.name}
            venueName={search.venue?.name}
            liveSearchAvailable={!search.venue || Boolean(search.venue.location)}
            status={fuelOriginId === origin.id ? fuelStatus : "idle"}
            error={fuelError}
            onLoad={() => loadFuel(search)}
          />
          </Suspense>
        </div>
      </Dialog>}
      {modal === "help" && (
        <Dialog
          title="Tu escapada, en tres pasos"
          onClose={() => setModal(null)}
        >
          <div className="help-content">
            {[
              {
                n: "01",
                title: "Elige tu pabellón y fechas",
                text: "Elige una instalación de bádminton, las fechas del torneo y las personas que viajan.",
              },
              {
                n: "02",
                title: "Encuentra tu rincón",
                text: "Ordena por presupuesto estimado por persona y noche, filtra por plataforma, tipo y distancia al pabellón. Guarda y compara opciones.",
              },
              {
                n: "03",
                title: "Descubre lo que tienes cerca",
                text: "Consulta supermercados y gasolineras de OpenStreetMap. Abre Booking o Airbnb con tu búsqueda para ver opciones y disponibilidad actualizadas.",
              },
            ].map((step) => (
              <div className="help-step" key={step.n}>
                <span>{step.n}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
            <div className="demo-disclaimer">
              <Info size={21} />
              <p>
                <strong>Transparencia desde el principio.</strong> Los hoteles
                proceden de Wikidata y OpenStreetMap. No copiamos catálogos de
                Booking o Airbnb. Airbnb se consulta mediante una búsqueda
                externa; no mostramos anuncios importados. Los enlaces «Buscar
                en Booking» consultan el nombre del hotel y su ubicación: pueden
                devolver otros resultados y no confirman una ficha en esa
                plataforma. Los enlaces publicados tampoco garantizan que la
                ficha siga activa. Las estimaciones propias de CERCA usan un
                modelo común por ciudad y categoría; no permiten afirmar qué
                hotel tiene hoy la tarifa más baja ni confirmar disponibilidad.
                En empates ordenamos por distancia al pabellón. El catálogo es
                limitado: las búsquedas externas amplían opciones y no se
                presentan como fichas importadas. Las instalaciones sin
                coordenadas confirmadas no generan recomendaciones de cercanía.
              </p>
            </div>
            <button className="primary-button" onClick={() => setModal(null)}>
              Vamos a explorar <ArrowRight size={17} />
            </button>
          </div>
        </Dialog>
      )}
      {modal === "privacy" && (
        <Dialog
          title="Tus datos, bajo tu control"
          onClose={() => setModal(null)}
        >
          <Suspense fallback={sectionFallback}>
          <LegalInformation
            analytics={analyticsConsent === "granted"}
            setAnalytics={(value) =>
              setAnalyticsConsent(value ? "granted" : "denied")
            }
            photos={photos}
            setPhotos={setPhotos}
            maps={maps}
            setMaps={setMaps}
            rememberSearch={rememberSearch}
            setRememberSearch={setRememberSearch}
            clearData={() => {
              setFavorites([]);
              setRecent([]);
              setTheme("system");
              setRememberSearch(false);
              setPhotos(false);
              setMaps(false);
              setAnalyticsConsent("unset");
              try {
                for (const key of [
                  "cerca-search-v3",
                  "cerca-remember-search-v1",
                  "cerca-recent-v1",
                  "cerca-favorites-v1",
                  "cerca-favorites-v2",
                  "cerca-theme-v1",
                  "cerca-saved-budgets-v1",
                  "cerca-team-utilities-v1",
                  "cerca-analytics-consent-v1",
                ])
                  localStorage.removeItem(key);
                window.dispatchEvent(new Event("cerca-budgets-cleared"));
                window.dispatchEvent(new Event("cerca-team-utilities-cleared"));
              } catch {
                /* Almacenamiento opcional */
              }
              setModal(null);
              setToast(
                "Se han eliminado tus favoritos, búsquedas, presupuestos, utilidades y ajustes.",
              );
            }}
          />
          </Suspense>
        </Dialog>
      )}
      {modal === "compare" && (
        <CompareDialog
          selections={compare}
          search={search}
          airbnbQuote={airbnbQuote}
          onAirbnbQuoteChange={setAirbnbQuote}
          onTrip={() => setModal("trip")}
          onClose={() => setModal(null)}
          onOpen={(selection) => {
            setModal(null);
            openDetail(selection.stay, selection.search);
          }}
          remove={(id) =>
            setCompare(compare.filter((entry) => entry.stay.id !== id))
          }
        />
      )}
      {detail && (
        <DetailDialog
          stay={detail.stay}
          search={detail.search}
          saved={isSaved(detail.stay.id)}
          onFavorite={() => toggleFavorite(detail.stay, detail.search)}
          onClose={() => setDetail(null)}
          markets={
            marketTownId === searchOrigin(detail.search).id ? markets : []
          }
          marketStatus={
            marketTownId === searchOrigin(detail.search).id
              ? marketStatus
              : "idle"
          }
          marketError={marketError}
          loadMarkets={() => loadMarkets(detail.search)}
        />
      )}
      </Suspense>
      <ConsentBanner
        consent={analyticsConsent}
        onChange={setAnalyticsConsent}
        onMore={() => setModal("privacy")}
      />
    </div>
  );
}
export default App;
