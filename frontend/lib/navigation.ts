"use client";

import { usePathname, useRouter } from "next/navigation";

/** Screen names from the Figma design's state-based router, preserved so the
 * ported components keep their original `onNavigate(screen)` API. Here each
 * one maps to a real App Router route instead of a useState value. */
export type Screen = "landing" | "onboarding" | "pipeline" | "dashboard" | "checkout" | "pricing" | "faq";

export const SCREEN_ROUTES: Record<Screen, string> = {
  landing: "/",
  onboarding: "/onboarding",
  pipeline: "/pipeline",
  dashboard: "/dashboard",
  checkout: "/checkout",
  pricing: "/pricing",
  faq: "/faq",
};

const ROUTE_SCREENS: Record<string, Screen> = Object.fromEntries(
  Object.entries(SCREEN_ROUTES).map(([screen, route]) => [route, screen as Screen])
) as Record<string, Screen>;

/** Drop-in replacement for the design's `setScreen` state setter. */
export function useNavigate(): (screen: Screen) => void {
  const router = useRouter();
  return (screen: Screen) => router.push(SCREEN_ROUTES[screen]);
}

/** Which screen the current URL corresponds to (drives Navbar active state). */
export function useCurrentScreen(): Screen {
  const pathname = usePathname();
  return ROUTE_SCREENS[pathname] ?? "landing";
}
