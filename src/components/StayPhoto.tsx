import { Building2 } from "lucide-react";
import { useContext, useState } from "react";
import { ExternalServices } from "./ExternalServices";
import type { Stay } from "../types";

export function StayPhoto({
  stay,
  className = "",
}: {
  stay: Stay;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const { photos } = useContext(ExternalServices);
  const external = /^https?:/.test(stay.images[0] ?? "");
  return stay.images[0] && !failed && (!external || photos) ? (
    <img
      className={className}
      src={stay.images[0]}
      alt={stay.name}
      loading="lazy"
      referrerPolicy="no-referrer"
      width="640"
      height="480"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className={`stay-photo-placeholder ${className}`}>
      <Building2 size={48} strokeWidth={1} />
      <span>{stay.name}</span>
      <small>
        {external && !photos
          ? "Foto externa: actívala en Privacidad"
          : "Fotografía no disponible"}
      </small>
    </span>
  );
}

export function PhotoCredit({ stay }: { stay: Stay }) {
  return stay.photoCredit ? (
    <small className="photo-credit">
      Foto: {stay.photoCredit.author} ·{" "}
      <a href={stay.photoCredit.source} target="_blank" rel="noreferrer">
        Fuente
      </a>
      {" · "}
      <a href={stay.photoCredit.licenceUrl} target="_blank" rel="noreferrer">
        {stay.photoCredit.licence}
      </a>
      {" · Tamaño adaptado para la tarjeta"}
    </small>
  ) : null;
}
