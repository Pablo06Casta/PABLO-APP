import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Building2,
  Check,
  ChevronRight,
  Compass,
  Download,
  Earth,
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
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import type {
  Filters,
  Market,
  RecentSearch,
  Search,
  Stay,
  StayType,
  Theme,
  Town,
} from "./types";
import { towns } from "./data/towns";
import {
  initialFilters,
  isoDate,
  money,
  nights,
  filterStays,
} from "./lib/search";
import { readStorage, useStored } from "./lib/storage";
import { demoStays, lodgingProvider } from "./services/lodging";
import { findMarkets, findTown } from "./services/places";
import { SearchBar } from "./components/SearchBar";
import { StayCard } from "./components/StayCard";
import { FiltersDialog } from "./components/FiltersDialog";
import { DetailDialog } from "./components/DetailDialog";
import { Dialog } from "./components/Dialog";
import { CompareDialog } from "./components/CompareDialog";
import { LazyMap as MapView } from "./components/LazyMap";
import { Markets } from "./components/Markets";
import "./App.css";

type Selection = { stay: Stay; search: Search };
type Favorite = { stay: Stay; town: Town };
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const currentYear = new Date().getFullYear();
const categories: Array<{ name: StayType; label: string; icon: typeof Home }> =
  [
    { name: "Todos", label: "Todos los alojamientos", icon: LayoutGrid },
    { name: "Apartamento", label: "Apartamentos", icon: Building2 },
    { name: "Hotel", label: "Hoteles", icon: BedDouble },
    { name: "Casa rural", label: "Casas rurales", icon: Trees },
    { name: "Habitación", label: "Habitaciones", icon: Home },
  ];
function initialSearch(): Search {
  const fallback: Search = {
    town: towns[0],
    checkIn: isoDate(7),
    checkOut: isoDate(10),
    guests: 2,
  };
  const value = readStorage<Search>("cerca-search-v1", fallback);
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
  const [search, setSearch] = useState<Search>(initialSearch);
  const [stays, setStays] = useState<Stay[]>(() => demoStays(search));
  const [filters, setFilters] = useState<Filters>({ ...initialFilters });
  const [sort, setSort] = useState("price");
  const [tab, setTab] = useState<"explore" | "map" | "favorites" | "settings">(
    "explore",
  );
  const [modal, setModal] = useState<
    "filters" | "markets" | "help" | "privacy" | "compare" | null
  >(null);
  const [detail, setDetail] = useState<Selection | null>(null);
  const [busy, setBusy] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [marketTownId, setMarketTownId] = useState("");
  const [marketStatus, setMarketStatus] = useState("idle");
  const [marketError, setMarketError] = useState("");
  const marketController = useRef<AbortController | null>(null);
  const searchGeneration = useRef(0);
  const [favorites, setFavorites] = useStored<Favorite[]>(
    "cerca-favorites-v1",
    [],
  );
  const [recent, setRecent] = useStored<RecentSearch[]>("cerca-recent-v1", []);
  const [theme, setTheme] = useStored<Theme>("cerca-theme-v1", "system");
  const [compare, setCompare] = useState<Selection[]>([]);
  const [toast, setToast] = useState("");
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(
    null,
  );

  useEffect(() => {
    try {
      localStorage.setItem("cerca-search-v1", JSON.stringify(search));
    } catch {
      /* Almacenamiento opcional */
    }
  }, [search]);
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
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const currentMarkets = useMemo(
    () => (marketTownId === search.town.id ? markets : []),
    [marketTownId, search.town.id, markets],
  );
  const visible = useMemo(
    () => filterStays(stays, search, filters, currentMarkets, sort),
    [stays, search, filters, currentMarkets, sort],
  );
  const activeFilterCount = [
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
    const generation = ++searchGeneration.current;
    marketController.current?.abort();
    marketController.current = null;
    setMarketStatus("idle");
    setMarketError("");
    setMarkets([]);
    setMarketTownId("");
    setBusy(true);
    setSearchError("");
    setTab("explore");
    setCompare([]);
    if (next.town.approximate) {
      try {
        const matches = await findTown(
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
        : [...favorites, { stay, town: query.town }],
    );
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
  }
  async function loadMarkets(town = detail?.search.town ?? search.town) {
    marketController.current?.abort();
    const controller = new AbortController();
    marketController.current = controller;
    setMarketStatus("loading");
    setMarketError("");
    setMarketTownId(town.id);
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const result = await findMarkets(town, controller.signal);
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
      setMarketStatus("error");
    } finally {
      clearTimeout(timeout);
    }
  }
  function openDetail(stay: Stay, query = search) {
    setModal(null);
    setDetail({ stay, search: query });
    if (marketTownId !== query.town.id) {
      marketController.current?.abort();
      marketController.current = null;
      setMarketTownId("");
      setMarketStatus("idle");
      setMarkets([]);
    }
  }
  function showMarkets() {
    setModal("markets");
    if (marketStatus === "idle" || marketTownId !== search.town.id)
      void loadMarkets(search.town);
  }
  function card(stay: Stay, query = search) {
    return (
      <StayCard
        key={stay.id}
        stay={stay}
        search={query}
        markets={marketTownId === query.town.id ? markets : []}
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
    { id: "favorites" as const, label: "Favoritos", icon: Heart },
    { id: "settings" as const, label: "Ajustes", icon: Settings },
  ];
  return (
    <div className={`cerca-app ${compare.length ? "has-comparison" : ""}`}>
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
            <button onClick={showMarkets}>
              Supermercados cerca <span className="new-dot" />
            </button>
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
        {(tab === "explore" || tab === "map") && (
          <>
            <section className="hero" aria-labelledby="main-title">
              <div className="hero-eyebrow">
                <span className="eyebrow-line" />
                <Sparkles size={13} /> MENOS BUSCAR. MÁS DISFRUTAR.
                <span className="eyebrow-line" />
              </div>
              <h1 id="main-title">
                ¿Dónde quieres <span>alojarte?</span>
              </h1>
              <p>
                Encuentra tu lugar. Y todo lo que necesitas,{" "}
                <strong>cerca.</strong>
              </p>
              <SearchBar
                key={`${search.town.id}-${search.checkIn}-${search.checkOut}-${search.guests}`}
                search={search}
                busy={busy}
                onSearch={runSearch}
              />
              <div className="quick-destinations">
                <span>
                  {recent.length
                    ? "Vuelve a explorar:"
                    : "Un poco de inspiración:"}
                </span>
                {(recent.length
                  ? recent.slice(0, 4).map((entry) => entry.town)
                  : towns.slice(0, 4)
                ).map((town) => (
                  <button
                    key={town.id}
                    onClick={() => runSearch({ ...search, town })}
                  >
                    <MapPin size={12} />
                    {town.name}
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
                <button onClick={() => setModal("filters")}>
                  <Wallet size={14} /> Hasta {money(filters.maxPrice)} / noche
                </button>
                <button onClick={() => setModal("filters")}>
                  <LocateFixed size={14} /> A menos de {filters.maxDistance} km
                  del centro
                </button>
                <button
                  className={filters.cancellation ? "selected" : ""}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      cancellation: !filters.cancellation,
                    })
                  }
                >
                  <ShieldCheck size={14} /> Cancelación gratuita
                  {filters.cancellation && <Check size={12} />}
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
                    {visible.length} alojamientos de ejemplo <span>·</span>{" "}
                    {nights(search)} noches <span>·</span> {search.guests}{" "}
                    {search.guests === 1 ? "huésped" : "huéspedes"}
                  </p>
                </div>
                <div className="results-controls">
                  <label className="sort-select">
                    <ArrowDownUp size={15} />
                    <span className="sr-only">Ordenar alojamientos</span>
                    <select
                      aria-label="Ordenar alojamientos"
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                    >
                      <option value="price">Menor precio total</option>
                      <option value="distance">Más cerca del centro</option>
                      <option value="rating">Mejor valoración</option>
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
              </div>
              <div className="demo-notice">
                <span>
                  <Info size={16} />
                  <span>
                    <strong>Estás explorando una demo.</strong> Alojamientos,
                    fotos, precios y valoraciones de ejemplo. Comprueba la
                    disponibilidad real en la plataforma.
                  </span>
                </span>
                <button onClick={() => setModal("help")}>
                  Saber más <ArrowUpRight size={13} />
                </button>
              </div>
              {search.town.approximate && (
                <p className="coordinate-notice">
                  El centro de {search.town.name} es aproximado (centroide
                  municipal). Las distancias se calculan respecto a ese punto.
                </p>
              )}
              {busy ? (
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
                    No hay alojamientos de demostración que encajen con estos
                    filtros. Prueba con otro presupuesto o tipo de estancia.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setFilters({ ...initialFilters })}
                  >
                    Restablecer filtros
                  </button>
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
                      onClick={() => loadMarkets(search.town)}
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
                  Descubre supermercados reales cerca de tu estancia.
                  <br className="desktop-break" /> Lo esencial, sin dar vueltas.
                </p>
              </div>
              <button className="primary-button" onClick={showMarkets}>
                Explorar supermercados <ArrowRight size={17} />
              </button>
            </section>
            <section className="benefits" aria-label="Por qué CERCA">
              <div>
                <span>
                  <Wallet size={23} />
                </span>
                <div>
                  <h3>Tu presupuesto primero</h3>
                  <p>Compara el precio total, sin hacer cuentas.</p>
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
                  <span>· Ejemplos de demostración</span>
                </div>
                <div className="stays-grid">
                  {favorites.map((entry) =>
                    card(entry.stay, { ...search, town: entry.town }),
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
                    Los favoritos, las búsquedas y los ajustes se guardan en
                    este navegador. Sin cuentas, sin anuncios.
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
                  <span className="version-badge">MVP · MODO DEMOSTRACIÓN</span>
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
          <span>Hecho para viajar sin complicaciones.</span>
        </div>
        <nav aria-label="Información">
          <button onClick={() => setModal("help")}>Sobre CERCA</button>
          <span>·</span>
          <button onClick={() => setModal("privacy")}>Privacidad</button>
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
      {compare.length > 0 && (
        <div className="compare-bar">
          <div className="compare-thumbnails">
            {compare.map(({ stay }) => (
              <img
                key={stay.id}
                src={stay.images[0]}
                alt="Alojamiento elegido"
              />
            ))}
          </div>
          <span>
            <strong>{compare.length} de 3</strong> para comparar
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
            onClick={() => setCompare([])}
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

      {modal === "filters" && (
        <FiltersDialog
          filters={filters}
          onClose={() => setModal(null)}
          onApply={(next) => {
            setFilters(next);
            setModal(null);
          }}
          hasMarkets={currentMarkets.length > 0}
          loadMarkets={() => loadMarkets(search.town)}
          marketsLoading={marketStatus === "loading"}
          marketError={marketStatus === "error" ? marketError : ""}
        />
      )}
      {modal === "markets" && (
        <Dialog
          title={`Supermercados cerca de ${search.town.name}`}
          onClose={() => setModal(null)}
          wide
        >
          <div className="markets-dialog-content">
            <p className="muted">
              Establecimientos reales ordenados por proximidad al centro de la
              localidad.
            </p>
            <Markets
              markets={marketTownId === search.town.id ? markets : []}
              origin={search.town}
              status={marketStatus}
              error={marketError}
              onLoad={() => loadMarkets(search.town)}
            />
          </div>
        </Dialog>
      )}
      {modal === "help" && (
        <Dialog
          title="Tu escapada, en tres pasos"
          onClose={() => setModal(null)}
        >
          <div className="help-content">
            {[
              {
                n: "01",
                title: "Elige dónde y cuándo",
                text: "Busca una ciudad o pueblo español, elige tus fechas y dinos cuántos venís.",
              },
              {
                n: "02",
                title: "Encuentra tu rincón",
                text: "Filtra por presupuesto, tipo de estancia y distancia. Guarda favoritos y compara hasta tres opciones.",
              },
              {
                n: "03",
                title: "Descubre lo que tienes cerca",
                text: "Consulta supermercados reales y abre Booking o Airbnb con tu búsqueda para ver opciones y disponibilidad actualizadas.",
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
                <strong>Transparencia desde el principio.</strong> Este MVP no
                está conectado a proveedores autorizados de alojamiento. Los
                alojamientos, ubicaciones, fotografías, precios, servicios y
                reseñas son ficticios o ilustrativos. No confirman
                disponibilidad y no se pueden reservar. Los enlaces abren
                búsquedas reales en Booking y Airbnb. Los supermercados proceden
                de OpenStreetMap y no se inventan.
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
          <div className="privacy-content">
            <ShieldCheck size={35} className="blue" />
            <h3>Solo lo necesario</h3>
            <p>
              Guardamos favoritos, destinos recientes, fechas y apariencia en el
              almacenamiento local de este navegador. No necesitas una cuenta.
            </p>
            <p>
              Las consultas de localidades y coordenadas se envían a Nominatim,
              los supermercados a Overpass y el mapa a OpenStreetMap. Los
              enlaces de reserva y rutas abren servicios externos con sus
              propias políticas. La ubicación requiere tu autorización y no se
              consulta en segundo plano.
            </p>
            <h3>Olvidar y empezar de nuevo</h3>
            <p>
              Este botón elimina los datos de CERCA guardados en este navegador,
              incluidos favoritos y búsquedas. No borra datos de las plataformas
              externas.
            </p>
            <button
              className="danger-button"
              onClick={() => {
                setFavorites([]);
                setRecent([]);
                setTheme("system");
                try {
                  localStorage.removeItem("cerca-search-v1");
                } catch {
                  /* opcional */
                }
                setModal(null);
                setToast(
                  "Se han eliminado tus favoritos, búsquedas guardadas y ajustes.",
                );
              }}
            >
              Borrar mis datos de CERCA
            </button>
          </div>
        </Dialog>
      )}
      {modal === "compare" && (
        <CompareDialog
          selections={compare}
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
          markets={marketTownId === detail.search.town.id ? markets : []}
          marketStatus={
            marketTownId === detail.search.town.id ? marketStatus : "idle"
          }
          marketError={marketError}
          loadMarkets={() => loadMarkets(detail.search.town)}
        />
      )}
    </div>
  );
}
export default App;
