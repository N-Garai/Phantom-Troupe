"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Lets framer-motion honor the OS reduced-motion setting globally without
 * any component branching on useReducedMotion during render (which causes
 * SSR hydration mismatches).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
