import { useEffect, useState } from "react";

/**
 * Detecta si el ancho de pantalla actual es "desktop" (>= 1280px, el
 * breakpoint xl de Tailwind). AppLayout lo usa para decidir si el chat va en
 * el panel fijo de la derecha o en el drawer superpuesto.
 */
export function useIsDesktop(breakpoint = 1280) {
  const [esDesktop, setEsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= breakpoint
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const handler = (e) => setEsDesktop(e.matches);

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [breakpoint]);

  return esDesktop;
}

export default useIsDesktop;
