import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  LocateFixed,
  LoaderCircle,
  MapPin,
  Minus,
  Plus,
  Search as SearchIcon,
  Users,
} from "lucide-react";
import type { Search, Town } from "../types";
import { localTowns, normalize, towns } from "../data/towns";
import { findTown, reverseTown } from "../services/places";
import { isoDate } from "../lib/search";

export function SearchBar({
  search,
  onSearch,
  busy,
}: {
  search: Search;
  onSearch: (search: Search) => void;
  busy: boolean;
}) {
  const [query, setQuery] = useState(search.town.name);
  const [selected, setSelected] = useState<Town | null>(search.town);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Town[]>([]);
  const [active, setActive] = useState(-1);
  const [guests, setGuests] = useState(search.guests);
  const [guestOpen, setGuestOpen] = useState(false);
  const [checkIn, setCheckIn] = useState(search.checkIn);
  const [checkOut, setCheckOut] = useState(search.checkOut);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [finding, setFinding] = useState(false);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const suggestions = options.length ? options : localTowns(query);
  const choose = (town: Town) => {
    setSelected(town);
    setQuery(town.name);
    setOpen(false);
    setOptions([]);
    setActive(-1);
    setError("");
  };
  async function lookup() {
    if (query.trim().length < 2) {
      setError("Escribe al menos dos letras de la localidad.");
      return;
    }
    setFinding(true);
    setError("");
    try {
      const result = await findTown(query.trim());
      setOptions(result);
      setOpen(true);
      if (!result.length)
        setError(
          "No encontramos esa localidad. Prueba con su nombre y provincia.",
        );
    } catch {
      setError(
        "No se puede conectar con el buscador de localidades. Puedes elegir uno de los destinos sugeridos.",
      );
    } finally {
      setFinding(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const town =
      selected ||
      towns.find((item) => normalize(item.name) === normalize(query));
    if (!town) {
      await lookup();
      return;
    }
    if (!checkIn || !checkOut || checkIn < isoDate(0) || checkOut <= checkIn) {
      setError("Elige una entrada desde hoy y una salida posterior.");
      return;
    }
    setOpen(false);
    setGuestOpen(false);
    onSearch({
      town,
      checkIn,
      checkOut,
      guests,
      venue: town.id === search.town.id ? search.venue : undefined,
    });
  }
  function locate() {
    if (!navigator.geolocation) {
      setError("Este navegador no permite consultar tu ubicación.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          choose(
            await reverseTown(
              position.coords.latitude,
              position.coords.longitude,
            ),
          );
        } catch (reason) {
          setError(
            reason instanceof Error && !(reason instanceof TypeError)
              ? reason.message
              : "No se pudo identificar tu localidad.",
          );
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError(
          "No se ha podido acceder a la ubicación. Puedes escribir una localidad.",
        );
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 300000 },
    );
  }
  return (
    <div className="search-area">
      <form className="search-bar" onSubmit={submit}>
        <div className="search-field destination-field">
          <MapPin size={21} className="field-icon" />
          <div className="field-content">
            <label htmlFor="destination">Dónde</label>
            <input
              id="destination"
              ref={input}
              value={query}
              placeholder="Ciudad del torneo"
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                active >= 0 ? `${listId}-${active}` : undefined
              }
              autoComplete="off"
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(null);
                setOptions([]);
                setOpen(true);
                setActive(-1);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setOpen(true);
                  setActive((value) =>
                    Math.min(value + 1, suggestions.length - 1),
                  );
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((value) => Math.max(0, value - 1));
                }
                if (event.key === "Escape") setOpen(false);
                if (
                  event.key === "Enter" &&
                  open &&
                  active >= 0 &&
                  suggestions[active]
                ) {
                  event.preventDefault();
                  choose(suggestions[active]);
                }
              }}
            />
          </div>
          {open && (
            <div className="destination-popover">
              <button
                type="button"
                className="location-option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={locate}
              >
                {locating ? (
                  <LoaderCircle size={18} className="spin" />
                ) : (
                  <LocateFixed size={18} />
                )}{" "}
                Usar mi ubicación
              </button>
              <span className="popover-caption">
                {query ? "LOCALIDADES" : "DESTINOS POPULARES"}
              </span>
              <ul id={listId} role="listbox" aria-label="Localidades de España">
                {suggestions.map((town, index) => (
                  <li
                    key={town.id}
                    role="option"
                    aria-label={`${town.name}, ${town.region}, España`}
                    id={`${listId}-${index}`}
                    aria-selected={active === index || selected?.id === town.id}
                  >
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(town)}
                      className={active === index ? "highlighted" : ""}
                    >
                      <span className="town-icon">
                        <MapPin size={19} />
                      </span>
                      <span>
                        <strong>{town.name}</strong>
                        <small>{town.region}, España</small>
                      </span>
                      {selected?.id === town.id && (
                        <Check size={16} className="blue" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              {query.trim().length > 1 && (
                <button
                  type="button"
                  className="lookup-button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={lookup}
                  disabled={finding}
                >
                  {finding ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <SearchIcon size={16} />
                  )}{" "}
                  Buscar «{query}» en toda España
                </button>
              )}
              <small className="data-credit">
                Búsqueda de localidades: © OpenStreetMap
              </small>
            </div>
          )}
        </div>
        <div className="search-field date-field">
          <CalendarDays size={20} className="field-icon" />
          <div className="field-content">
            <label htmlFor="check-in">Entrada</label>
            <input
              id="check-in"
              type="date"
              required
              min={isoDate(0)}
              value={checkIn}
              onChange={(event) => {
                setCheckIn(event.target.value);
                if (event.target.value >= checkOut) {
                  const next = new Date(event.target.value + "T12:00:00");
                  next.setDate(next.getDate() + 1);
                  setCheckOut(
                    `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`,
                  );
                }
              }}
            />
          </div>
        </div>
        <div className="search-field date-field">
          <CalendarDays size={20} className="field-icon" />
          <div className="field-content">
            <label htmlFor="check-out">Salida</label>
            <input
              id="check-out"
              type="date"
              required
              min={checkIn}
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
            />
          </div>
        </div>
        <div className="search-field guest-field">
          <Users size={20} className="field-icon" />
          <div className="field-content">
            <span className="field-label">Quiénes</span>
            <button
              type="button"
              className="guest-toggle"
              onClick={() => {
                setGuestOpen(!guestOpen);
                setOpen(false);
              }}
              aria-expanded={guestOpen}
              aria-label="Seleccionar huéspedes"
            >
              {guests} {guests === 1 ? "huésped" : "huéspedes"}
              <ChevronDown size={14} />
            </button>
          </div>
          {guestOpen && (
            <div className="guest-popover">
              <div>
                <strong>Huéspedes</strong>
                <small>¿Con quién te escapas?</small>
              </div>
              <div className="stepper">
                <button
                  type="button"
                  aria-label="Quitar huésped"
                  disabled={guests === 1}
                  onClick={() => setGuests(guests - 1)}
                >
                  <Minus size={16} />
                </button>
                <span aria-live="polite">{guests}</span>
                <button
                  type="button"
                  aria-label="Añadir huésped"
                  disabled={guests === 8}
                  onClick={() => setGuests(guests + 1)}
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                type="button"
                className="guest-done"
                onClick={() => setGuestOpen(false)}
              >
                Listo
              </button>
            </div>
          )}
        </div>
        <button
          className="search-submit"
          type="submit"
          disabled={busy || finding}
          aria-label="Buscar alojamientos"
        >
          {busy || finding ? (
            <LoaderCircle size={20} className="spin" />
          ) : (
            <SearchIcon size={20} />
          )}
          <span>Buscar</span>
        </button>
      </form>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
