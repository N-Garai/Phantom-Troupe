"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
};

/** Scroll-reveal wrapper: fades + rises into view (MotionConfig honors reduced motion). */
export function Reveal({ children, delay = 0, y = 28, className, once = true }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, margin: "-12% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

type SplitTextProps = {
  text: string;
  className?: string;
  stagger?: number;
  delay?: number;
};

/** Zentry-style per-character reveal for display headings. */
export function SplitText({ text, className, stagger = 0.035, delay = 0 }: SplitTextProps) {
  const chars = Array.from(text);
  return (
    <span className={className} aria-label={text} role="text">
      {chars.map((c, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block will-change-transform"
          initial={{ opacity: 0, y: "0.7em", rotateX: 55, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.75,
            delay: delay + i * stagger,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {c === " " ? "\u00A0" : c}
        </motion.span>
      ))}
    </span>
  );
}
