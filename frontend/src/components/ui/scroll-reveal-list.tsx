"use client";

import { useEffect, useRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

function useRevealChildren<TElement extends HTMLElement>() {
  const ref = useRef<TElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) return;

    container.dataset.revealReady = "true";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    );

    function observeChildren(revealContainer: TElement) {
      Array.from(revealContainer.children).forEach((child, index) => {
        if (!(child instanceof HTMLElement) || child.classList.contains("is-revealed")) return;
        child.style.setProperty("--reveal-delay", `${(index % 8) * 65}ms`);
        observer.observe(child);
      });
    }

    observeChildren(container);
    const mutationObserver = new MutationObserver(() => observeChildren(container));
    mutationObserver.observe(container, { childList: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return ref;
}

export function ScrollRevealList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRevealChildren<HTMLDivElement>();
  return <div ref={ref} className={cn("scroll-reveal-list", className)} {...props} />;
}

export function ScrollRevealTableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  const ref = useRevealChildren<HTMLTableSectionElement>();
  return <tbody ref={ref} className={cn("scroll-reveal-list", className)} {...props} />;
}
