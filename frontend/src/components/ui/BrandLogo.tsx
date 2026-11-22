import React, { useEffect, useState } from "react";
import { apiUrl } from "../../services/api";
import { Icon } from "./icons";

interface BrandLogoProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function BrandLogo({ src, alt = "Logo institucional", className = "", fallback }: BrandLogoProps): React.ReactElement {
  const [fallido, setFallido] = useState(false);
  const url = apiUrl(src);

  useEffect(() => {
    setFallido(false);
  }, [src]);

  if (!url || fallido) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white ${className}`}
      >
        {fallback ?? <Icon name="courses" className="w-1/2 h-1/2" />}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={() => {
        setFallido(true);
      }}
    />
  );
}
