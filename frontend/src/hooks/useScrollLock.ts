import { useEffect } from "react";

export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const main = document.getElementById("main-content");
    if (!main) return;

    const overflowAnterior = main.style.overflow;
    main.style.overflow = "hidden";
    return () => {
      main.style.overflow = overflowAnterior;
    };
  }, [active]);
}
