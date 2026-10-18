import React, { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getConfigBranding } from "../services/config.service";
import { apiUrl } from "../services/api";

interface BrandingContextValue {
  nombre: string | null;
  logoUrl: string | null;
}

const BrandingContext = createContext<BrandingContextValue>({ nombre: null, logoUrl: null });

// Defaults que coinciden con :root de index.css y tailwind.config.js.
const DEFAULT_PRIMARY = "#003d7a";
const DEFAULT_SECONDARY = "#0369a1";
const DEFAULT_LIGHT = "#dbeafe";

export function BrandingProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { data } = useQuery({
    queryKey: ["config", "branding"],
    queryFn: getConfigBranding,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", data?.colorPrimario ?? DEFAULT_PRIMARY);
    root.style.setProperty("--color-secondary", data?.colorSecundario ?? DEFAULT_SECONDARY);
    root.style.setProperty("--color-primary-light", data?.colorClaro ?? DEFAULT_LIGHT);
  }, [data]);

  return (
    <BrandingContext.Provider value={{ nombre: data?.nombre ?? null, logoUrl: apiUrl(data?.logoUrl) }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextValue {
  return useContext(BrandingContext);
}
