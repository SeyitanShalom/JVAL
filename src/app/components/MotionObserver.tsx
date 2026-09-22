"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const MOTION_SELECTOR = [
  "[data-motion]",
  ".motion-panel",
  ".motion-card",
  ".motion-stagger > *",
].join(",");

export default function MotionObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-motion-root]");
    if (!root) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let observer: IntersectionObserver | null = null;
    let mutationFrame = 0;

    if (!prefersReducedMotion && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("motion-visible");
            observer?.unobserve(entry.target);
          });
        },
        {
          rootMargin: "0px 0px -8% 0px",
          threshold: 0.08,
        },
      );
    }

    const initMotionElements = () => {
      const elements = Array.from(
        root.querySelectorAll<HTMLElement>(MOTION_SELECTOR),
      ).filter(
        (element) =>
          !element.classList.contains("motion-reveal") &&
          !element.closest("[data-motion-skip]"),
      );

      elements.forEach((element, index) => {
        element.classList.add("motion-reveal");
        element.style.setProperty(
          "--motion-delay",
          `${Math.min(index * 45, 420)}ms`,
        );
      });

      if (!observer) {
        elements.forEach((element) => element.classList.add("motion-visible"));
        return;
      }

      elements.forEach((element) => observer?.observe(element));
    };

    const frame = window.requestAnimationFrame(initMotionElements);
    const mutationObserver = new MutationObserver(() => {
      if (mutationFrame) window.cancelAnimationFrame(mutationFrame);
      mutationFrame = window.requestAnimationFrame(initMotionElements);
    });

    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      window.cancelAnimationFrame(frame);
      if (mutationFrame) window.cancelAnimationFrame(mutationFrame);
      mutationObserver.disconnect();
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
