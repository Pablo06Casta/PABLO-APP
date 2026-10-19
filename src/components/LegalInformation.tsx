import { ShieldCheck } from "lucide-react";

const dataFiles = [
  ["osm-stays.json", "Alojamientos OSM"],
  ["venue-markets.json", "Supermercados y tiendas OSM"],
  ["granada-markets.json", "Comercios de Granada OSM"],
  ["venues.json", "Sedes y ubicaciones"],
];
export function LegalInformation({
  photos,
  setPhotos,
  maps,
  setMaps,
  rememberSearch,
  setRememberSearch,
  clearData,
}: {
  photos: boolean;
  setPhotos: (value: boolean) => void;
  maps: boolean;
  setMaps: (value: boolean) => void;
  rememberSearch: boolean;
  setRememberSearch: (value: boolean) => void;
  clearData: () => void;
}) {
  return (
    <div className="privacy-content">
      <ShieldCheck size={35} className="blue" />
      <p>Información actualizada el 19 de octubre de 2026.</p>
      <h3>Quién mantiene CERCA</h3>
      <p>
        Proyecto personal sin ingresos de Pablo, titular de la cuenta de GitHub
        Pablo06Casta. CERCA es independiente y no está afiliada a Booking.com ni
        a Airbnb. No tramitamos reservas, pagos ni cuentas de viajeros.
      </p>
      <p>
        Contacto:{" "}
        <a
          href="https://github.com/Pablo06Casta/PABLO-APP/issues/new?title=Contacto%20CERCA"
          target="_blank"
          rel="noreferrer"
        >
          contactar con Pablo mediante GitHub
        </a>
        . Las consultas son públicas: no publiques documentos de identidad,
        ubicaciones privadas ni otros datos sensibles. Puedes pedir un canal
        privado antes de aportar información personal.
      </p>
      <h3>Elige qué guardar y cargar</h3>
      <label className="privacy-option">
        <input
          type="checkbox"
          checked={rememberSearch}
          onChange={(e) => setRememberSearch(e.target.checked)}
        />
        <span>
          <strong>Recordar mis búsquedas en este navegador</strong>
          <small>
            Opcional. Guarda destino, fechas, grupo y hasta cinco destinos
            recientes hasta que lo desactives o borres los datos. Sin esta
            opción, se mantienen solo mientras la aplicación está abierta.
          </small>
        </span>
      </label>
      <label className="privacy-option">
        <input
          type="checkbox"
          checked={photos}
          onChange={(e) => setPhotos(e.target.checked)}
        />
        <span>
          <strong>Mostrar fotos externas de Wikimedia en esta visita</strong>
          <small>
            Wikimedia recibirá tu IP y datos técnicos al cargar imágenes. Las
            fotos alojadas por CERCA no necesitan esta opción. Puedes
            desactivarla; no revierte solicitudes ya realizadas.
          </small>
        </span>
      </label>
      <label className="privacy-option">
        <input
          type="checkbox"
          checked={maps}
          onChange={(e) => setMaps(e.target.checked)}
        />
        <span>
          <strong>Cargar mapas de OpenStreetMap en esta visita</strong>
          <small>
            El proveedor recibirá tu IP, datos técnicos y las áreas del mapa
            consultadas. No cargamos el mapa externo hasta que lo actives.
          </small>
        </span>
      </label>
      <h3>Datos, finalidad y conservación</h3>
      <p>
        Los favoritos y la apariencia se guardan localmente cuando los eliges,
        para prestarte esas funciones, hasta que los elimines o limpies el
        navegador. Las búsquedas se conservan solo si activas «Recordar». CERCA
        no envía esos favoritos o búsquedas a un servidor propio, no incorpora
        publicidad ni analítica y no elabora perfiles o decisiones automatizadas
        sobre personas. La ordenación compara un presupuesto de viaje.
      </p>
      <p>
        El almacenamiento funcional responde a las acciones que solicitas.
        Recordar búsquedas y activar fotos o mapas externos son opciones
        voluntarias que puedes retirar aquí. Para los tratamientos sujetos al
        RGPD, las funciones opcionales se basan en tu consentimiento (art.
        6.1.a); la prestación de funciones solicitadas, en atender tu solicitud
        de servicio (art. 6.1.b), y la entrega y seguridad técnica del sitio, en
        el interés legítimo de mantenerlo operativo (art. 6.1.f), según
        corresponda al tratamiento.
      </p>
      <p>
        La ubicación solo se solicita al pulsar «Usar mi ubicación», con permiso
        del navegador. Las coordenadas se envían a Nominatim para identificar la
        localidad; no hacemos seguimiento en segundo plano. Puedes escribir un
        destino en su lugar. El buscador local no envía lo que tecleas; buscar
        una localidad fuera del catálogo o precisar un centro municipal consulta
        Nominatim.
      </p>
      <h3>Servicios externos y transferencias</h3>
      <p>
        GitHub Pages sirve la aplicación y puede tratar la IP y registros
        técnicos de las visitas conforme a su política. Los mapas y la
        geocodificación usan servicios de OpenStreetMap; las fotos externas,
        Wikimedia; la actualización de comercios envía la zona de la sede a
        Overpass o a la API de OpenStreetMap. El catálogo guardado no necesita
        esas consultas. Cada conexión comunica al proveedor IP y datos técnicos,
        además de la consulta correspondiente.
      </p>
      <p>
        Estos proveedores pueden tratar datos fuera del Espacio Económico
        Europeo. Sus políticas describen ubicación, conservación y, cuando
        proceda, garantías para las transferencias. CERCA no fija los plazos de
        los registros de terceros ni puede borrarlos mediante este botón. Revisa
        sus condiciones antes de activar funciones externas; puedes usar el
        catálogo local sin fotos ni mapas externos.
      </p>
      <ul>
        <li>
          <a
            href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
            target="_blank"
            rel="noreferrer"
          >
            GitHub: privacidad y transferencias
          </a>
        </li>
        <li>
          <a
            href="https://osmfoundation.org/wiki/Privacy_Policy"
            target="_blank"
            rel="noreferrer"
          >
            OpenStreetMap Foundation: privacidad
          </a>{" "}
          ·{" "}
          <a href="https://overpass-api.de/" target="_blank" rel="noreferrer">
            Servicio Overpass
          </a>
        </li>
        <li>
          <a
            href="https://foundation.wikimedia.org/wiki/Policy:Privacy_policy"
            target="_blank"
            rel="noreferrer"
          >
            Wikimedia: privacidad
          </a>
        </li>
        <li>
          <a
            href="https://www.ocu.org/organizacion/privacidad"
            target="_blank"
            rel="noreferrer"
          >
            OCU: privacidad
          </a>
        </li>
      </ul>
      <p>
        Los enlaces a Booking, Airbnb, Google Maps y al comparador de OCU solo
        abren sus servicios cuando los pulsas. Los enlaces de búsqueda o reserva
        incluyen destino, fechas y grupo; los de gasolineras incluyen el nombre
        y la dirección, y los de rutas, el origen y destino seleccionados. Desde
        ese momento se aplican sus políticas y condiciones.
      </p>
      <h3>Tus derechos y cómo borrar datos</h3>
      <p>
        Cuando proceda, puedes solicitar acceso, rectificación, supresión,
        limitación, oposición y portabilidad, y retirar el consentimiento sin
        afectar al tratamiento anterior. Contacta con Pablo por el canal
        indicado; no publiques información personal en una incidencia. Puedes
        reclamar ante la{" "}
        <a href="https://www.aepd.es/" target="_blank" rel="noreferrer">
          Agencia Española de Protección de Datos
        </a>
        . Para datos que solo están en tu navegador, utiliza este control o los
        ajustes del navegador.
      </p>
      <p>
        El botón elimina favoritos, búsquedas y apariencia de CERCA y desactiva
        fotos y mapas externos. No borra datos en otras plataformas. Para
        eliminar también la copia técnica sin conexión, borra los datos del
        sitio desde los ajustes del navegador; no contiene un historial personal
        de reservas.
      </p>
      <button className="danger-button" onClick={clearData}>
        Borrar mis datos de CERCA
      </button>
      <h3>Precios y enlaces de reserva</h3>
      <p>
        Algunas tarjetas muestran precios medios aportados al proyecto, con la
        fuente indicada como Booking o como estimación. CERCA no consulta ni
        actualiza esas cifras directamente en Booking o Airbnb. Cuando no existe
        una referencia para el alojamiento, utiliza su propio modelo de
        planificación. Ninguna cifra es una oferta, descuento, tarifa actual o
        disponibilidad confirmada; puede excluir impuestos y cargos. Eventos,
        puentes y fiestas pueden cambiar las condiciones. El orden por precio es
        orientativo y no identifica el hotel con menor tarifa real. Un
        identificador o enlace publicado no acredita que la ficha siga activa.
        Confirma todo en la plataforma antes de reservar.
      </p>
      <h3>Calendario de competiciones</h3>
      <p>
        Las fechas, ciudades y nombres de los torneos se seleccionan del{" "}
        <a
          href="https://www.badminton.es/calendar/192/Calendario-FESBA"
          target="_blank"
          rel="noreferrer"
        >
          calendario público de la Federación Española de Bádminton
        </a>
        . Cada tarjeta enlaza a su ficha oficial y muestra la fecha de consulta
        de CERCA. La federación puede modificar fechas o sedes; coincidir en
        ciudad no confirma el pabellón. CERCA actualiza su copia al publicar la
        web y no envía tus búsquedas a la federación; su sitio se abre solo al
        pulsar un enlace.
      </p>
      <h3>Fuentes, licencias y descarga de datos</h3>
      <p>
        Los datos estructurados de Wikidata se reutilizan bajo{" "}
        <a
          href="https://www.wikidata.org/wiki/Wikidata:Licensing"
          target="_blank"
          rel="noreferrer"
        >
          CC0
        </a>
        . Los alojamientos, comercios y ubicaciones procedentes de OpenStreetMap
        son © OpenStreetMap contributors, bajo{" "}
        <a
          href="https://opendatacommons.org/licenses/odbl/1-0/"
          target="_blank"
          rel="noreferrer"
        >
          ODbL 1.0
        </a>
        . Se han seleccionado por cercanía a las sedes, normalizado y eliminado
        duplicados; algunas coordenadas son centros de edificios. Ofrecemos las
        bases derivadas en formato JSON, con sus fuentes y fechas:
      </p>
      <ul>
        {dataFiles.map(([file, label]) => (
          <li key={file}>
            <a href={`${import.meta.env.BASE_URL}data/${file}`} download>
              {label}: descargar JSON
            </a>
          </li>
        ))}
      </ul>
      <p>
        <a href={`${import.meta.env.BASE_URL}data/README.md`} download>
          Método, licencias y condiciones de reutilización
        </a>{" "}
        ·{" "}
        <a
          href="https://github.com/Pablo06Casta/PABLO-APP/tree/main/src/data"
          target="_blank"
          rel="noreferrer"
        >
          Datos y fuentes en el repositorio
        </a>
        .
      </p>
      <p>
        Las fotografías tienen sus propios autores y licencias, indicados junto
        a cada imagen con enlaces a la fuente y a la licencia. Las licencias de
        los datos no sustituyen a las de las fotos. El catálogo municipal
        conserva su{" "}
        <a
          href={`${import.meta.env.BASE_URL}data/municipalities-NOTICE.md`}
          download
        >
          licencia ISC
        </a>
        ; la tipografía Inter conserva su{" "}
        <a href={`${import.meta.env.BASE_URL}licenses/Inter-OFL.txt`} download>
          licencia OFL
        </a>
        .
      </p>
      <p>
        No se publican anuncios importados de Inside Airbnb. La búsqueda externa
        de Airbnb no representa una conexión con su inventario ni una
        recomendación de anuncios verificados. No extraemos automáticamente el
        catálogo de Booking o Airbnb.
      </p>
    </div>
  );
}
