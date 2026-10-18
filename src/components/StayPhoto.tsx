import { Building2 } from "lucide-react";
import { useState } from "react";
import type { Stay } from "../types";

export function StayPhoto({
  stay,
  className = "",
}: {
  stay: Stay;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return stay.images[0] && !failed ? (
    <img
      className={className}
      src={stay.images[0]}
      alt={stay.name}
      loading="lazy"
      width="640"
      height="480"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className={`stay-photo-placeholder ${className}`}>
      <Building2 size={48} strokeWidth={1} />
      <span>{stay.name}</span>
      <small>Fotografía no disponible</small>
    </span>
  );
}

export function PhotoCredit({ stay }: { stay: Stay }) {
  return stay.photoCredit ? (
    <small className="photo-credit">
      Foto: {stay.photoCredit.author} ·{" "}
      <a href={stay.photoCredit.source} target="_blank" rel="noreferrer">
        {stay.photoCredit.licence}
      </a>
    </small>
  ) : null;
}
