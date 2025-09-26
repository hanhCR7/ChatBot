import { useState, useEffect } from "react";

export function useResponsive() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1280;
  const isDesktop = width >= 1280;

  return { width, isMobile, isTablet, isDesktop };
}
