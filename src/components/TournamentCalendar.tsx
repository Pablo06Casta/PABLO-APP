import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, List, MapPin, Trophy } from "lucide-react";
import type { Search, Venue } from "../types";
import {
  dateInSpain,
  isUpcomingTournament,
  suggestedTripDates,
  tournamentCatalogue,
  tournamentVenues,
  type Tournament,
} from "../data/tournaments";

const dayFormat = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const monthFormat = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
function readableDay(value: string) {
  return dayFormat.format(new Date(`${value}T12:00:00Z`));
}
function readableMonth(value: string) {
  const label = monthFormat.format(new Date(`${value}T12:00:00Z`));
  return label[0].toUpperCase() + label.slice(1);
}
const weekdays = ["L", "M", "X", "J", "V", "S", "D"];
function calendarDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1, 12));
  const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
    const day = new Date(Date.UTC(year, monthNumber - 1, index - offset + 1, 12));
    return day.toISOString().slice(0, 10);
  });
}
function shiftMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + amount, 1, 12))
    .toISOString()
    .slice(0, 7);
}

export function TournamentCalendar({
  search,
  onPlan,
  today = dateInSpain(),
  events = tournamentCatalogue.events,
}: {
  search: Search;
  today?: string;
  events?: Tournament[];
  onPlan: (event: Tournament, venue: Venue) => void;
}) {
  const [city, setCity] = useState("all");
  const [month, setMonth] = useState("all");
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [calendarMonth, setCalendarMonth] = useState(today.slice(0, 7));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [limit, setLimit] = useState(18);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const ageDays = Math.floor(
    (Date.parse(`${today}T12:00:00Z`) -
      Date.parse(`${tournamentCatalogue.retrievedAt}T12:00:00Z`)) /
      86400000,
  );
  const upcoming = useMemo(
    () =>
      events.filter((event) =>
        isUpcomingTournament(event, today),
      ),
    [today, events],
  );
  const cities = [...new Set(upcoming.map((event) => event.city))].sort(
    (a, b) => a.localeCompare(b, "es"),
  );
  const months = [
    ...new Set(upcoming.map((event) => event.startDate.slice(0, 7))),
  ];
  const cityFiltered = upcoming.filter((event) => {
    const cityMatches =
      city === "all" ||
      (city === "near"
        ? tournamentVenues(event).length > 0
        : city === "current"
          ? event.destination === search.venue?.city ||
            event.city === search.town.name
          : event.city === city);
    return cityMatches;
  });
  const filtered = view === "list"
    ? cityFiltered.filter((event) => month === "all" || event.startDate.startsWith(month))
    : cityFiltered;
  const days = calendarDays(calendarMonth);
  const firstDayWithEvent = days.find((day) =>
    day.startsWith(calendarMonth) && cityFiltered.some((event) => event.startDate <= day && (event.endDate ?? event.startDate) >= day),
  );
  const activeDay = selectedDay?.startsWith(calendarMonth) ? selectedDay : firstDayWithEvent ?? null;
  const dayEvents = activeDay
    ? cityFiltered.filter((event) => event.startDate <= activeDay && (event.endDate ?? event.startDate) >= activeDay)
    : [];
  const shown = filtered.slice(0, limit);
  const groups = new Map<string, Tournament[]>();
  for (const event of shown) {
    const key = event.startDate.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  function renderCards(eventsToRender: Tournament[]) {
    return eventsToRender.map((event) => {
      const available = tournamentVenues(event);
      const selected = available.find(
        (venue) => venue.id === choices[event.id],
      );
      const dates = suggestedTripDates(event, today);
      return (
        <article className="tournament-card" key={event.id}>
          <span className="tournament-kind">
            {event.group}
            {event.category ? ` · ${event.category}` : ""}
          </span>
          <h3>{event.name}</h3>
          <p className="tournament-date">
            <CalendarDays size={16} />
            {event.endDate && event.endDate !== event.startDate
              ? `${readableDay(event.startDate)} – ${readableDay(event.endDate)}`
              : readableDay(event.startDate)}
          </p>
          <p className="tournament-city">
            <MapPin size={16} />
            {event.city}
          </p>
          {available.length ? (
            <>
              <p className="tournament-caveat">
                La federación indica la ciudad; confirma el pabellón
                del torneo en la ficha oficial. Elige uno de CERCA
                para explorar alojamientos cerca.
              </p>
              <label className="tournament-venue-label">
                Pabellón para tu búsqueda
                <select
                  value={selected?.id ?? ""}
                  onChange={(change) =>
                    setChoices((previous) => ({
                      ...previous,
                      [event.id]: change.target.value,
                    }))
                  }
                >
                  <option value="">
                    Elige un pabellón confirmado
                  </option>
                  {available.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="tournament-plan"
                disabled={!selected}
                onClick={() => selected && onPlan(event, selected)}
              >
                Buscar alojamiento · {readableDay(dates.checkIn)} –{" "}
                {readableDay(dates.checkOut)}
              </button>
              <small>
                Fechas de viaje sugeridas: víspera del inicio y salida
                al día siguiente. Podrás editarlas.
              </small>
            </>
          ) : (
            <p className="tournament-caveat">
              CERCA todavía no tiene un pabellón confirmado para esta
              ciudad. Consulta la sede en la federación.
            </p>
          )}
          <a
            className="tournament-official"
            href={event.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Ver ficha en badminton.es <ArrowUpRight size={15} />
          </a>
        </article>
      );
    });
  }
  return (
    <section className="tournament-page" aria-labelledby="tournaments-title">
      <div className="tournament-intro">
        <span className="venue-sport">
          <Trophy size={16} /> BÁDMINTON EN ESPAÑA
        </span>
        <h1 id="tournaments-title">Próximos torneos</h1>
        <p>
          Competiciones publicadas por la Federación Española de Bádminton. El
          calendario guarda una copia con fecha; consulta siempre la ficha
          oficial por si cambia el torneo.
        </p>
        <div className="tournament-source">
          <span>
            <CalendarDays size={16} /> Datos consultados el{" "}
            {readableDay(tournamentCatalogue.retrievedAt)} · {upcoming.length}{" "}
            torneos futuros
          </span>
          <a href={tournamentCatalogue.source} target="_blank" rel="noreferrer">
            Calendario oficial <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
      {ageDays > 14 && (
        <p className="tournament-stale">
          La copia tiene más de dos semanas. Consulta la ficha oficial antes de
          planificar el viaje.
        </p>
      )}
      <div className="tournament-view-switch" role="group" aria-label="Vista de torneos">
        <button type="button" className={view === "calendar" ? "active" : ""} aria-pressed={view === "calendar"} onClick={() => setView("calendar")}><CalendarDays size={17} /> Calendario</button>
        <button type="button" className={view === "list" ? "active" : ""} aria-pressed={view === "list"} onClick={() => setView("list")}><List size={17} /> Lista</button>
      </div>
      <div className="tournament-controls">
        <label>
          Ciudad
          <select
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setLimit(18);
              setSelectedDay(null);
            }}
          >
            <option value="all">Todas las ciudades</option>
            <option value="current">
              Mi destino actual · {search.town.name}
            </option>
            <option value="near">
              Destinos con pabellones confirmados en CERCA
            </option>
            {cities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        {view === "list" && <label>
          Mes
          <select
            value={month}
            onChange={(event) => {
              setMonth(event.target.value);
              setLimit(18);
            }}
          >
            <option value="all">Todos los meses</option>
            {months.map((item) => (
              <option key={item} value={item}>
                {readableMonth(`${item}-01`)}
              </option>
            ))}
          </select>
        </label>}
      </div>
      <p className="tournament-count" role="status">
        {filtered.length} {filtered.length === 1 ? "torneo" : "torneos"} con
        estos filtros.
      </p>
      {view === "calendar" && (
        <div className="tournament-calendar" aria-label="Calendario mensual de torneos">
          <div className="tournament-calendar-header">
            <h2>{readableMonth(`${calendarMonth}-01`)}</h2>
            <div className="tournament-calendar-nav">
              <button type="button" aria-label="Mes anterior" onClick={() => { setCalendarMonth(shiftMonth(calendarMonth, -1)); setSelectedDay(null); }}><ChevronLeft size={19} /></button>
              <button type="button" aria-label="Mes siguiente" onClick={() => { setCalendarMonth(shiftMonth(calendarMonth, 1)); setSelectedDay(null); }}><ChevronRight size={19} /></button>
            </div>
          </div>
          <div className="tournament-calendar-grid">
            {weekdays.map((day, index) => <span className="tournament-weekday" key={index} aria-label={["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][index]}>{day}</span>)}
            {days.map((day) => {
              const onDay = cityFiltered.filter((event) => event.startDate <= day && (event.endDate ?? event.startDate) >= day);
              const inMonth = day.startsWith(calendarMonth);
              return <button key={day} type="button" className={`tournament-calendar-day${inMonth ? "" : " outside"}${onDay.length ? " has-events" : ""}${activeDay === day ? " selected" : ""}${day === today ? " today" : ""}`} aria-label={`${readableDay(day)}: ${onDay.length} ${onDay.length === 1 ? "torneo" : "torneos"}`} aria-pressed={activeDay === day} onClick={() => { if (!inMonth) setCalendarMonth(day.slice(0, 7)); setSelectedDay(day); }}>
                <span className="tournament-day-number">{Number(day.slice(-2))}</span>
                {onDay.length > 0 && <span className="tournament-day-events"><span className="tournament-day-count">{onDay.length}</span><span className="tournament-day-label">{onDay.length === 1 ? onDay[0].city : `${onDay.length} torneos`}</span></span>}
              </button>;
            })}
          </div>
          <div className="tournament-selected-day">
            <h2>{activeDay ? `Torneos del ${readableDay(activeDay)}` : "No hay torneos este mes"}</h2>
            {!dayEvents.length && <p>{activeDay ? "No hay torneos para este día con los filtros elegidos." : "Avanza de mes o cambia la ciudad para ver próximas competiciones."}</p>}
          </div>
        </div>
      )}
      {(view === "calendar" ? dayEvents : shown).length ? (
        view === "calendar" ? (
          <div className="tournament-grid">{renderCards(dayEvents)}</div>
        ) : (
        [...groups].map(([key, events]) => (
          <section
            className="tournament-month"
            key={key}
            aria-label={readableMonth(`${key}-01`)}
          >
            <h2>{readableMonth(`${key}-01`)}</h2>
            <div className="tournament-grid">
              {renderCards(events)}
            </div>
          </section>
        )))
      ) : (
        view === "list" && <div className="tournament-empty">
          <Trophy size={30} />
          <h2>No hay torneos con estos filtros</h2>
          <p>
            Prueba otra ciudad o consulta el calendario oficial. Las sedes de
            2027 siguen publicándose.
          </p>
        </div>
      )}
      {view === "list" && filtered.length > shown.length && (
        <button
          className="tournament-more"
          onClick={() => setLimit((value) => value + 18)}
        >
          Mostrar más torneos
        </button>
      )}
      <p className="tournament-footnote">
        Fuente: Federación Española de Bádminton. Se muestran competiciones en
        España con ciudad publicada; se excluyen cursos, concentraciones y
        reuniones. Algunos eventos de 2027 aún no tienen ciudad confirmada. La
        ciudad no verifica un pabellón ni garantiza que el torneo siga en las
        mismas fechas.
      </p>
    </section>
  );
}
