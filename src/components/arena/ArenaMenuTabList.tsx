"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type ArenaMenuTabId =
  | "overview"
  | "agents"
  | "decision"
  | "history"
  | "stats"
  | "integration";

type ArenaMenuTabListProps = {
  tabs: { id: ArenaMenuTabId; label: string }[];
  activeTab: ArenaMenuTabId;
  onTabChange: (id: ArenaMenuTabId) => void;
  open: boolean;
};

export function ArenaMenuTabList({
  tabs,
  activeTab,
  onTabChange,
  open,
}: ArenaMenuTabListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<ArenaMenuTabId, HTMLButtonElement>>(new Map());
  const [scrollHints, setScrollHints] = useState({ left: false, right: false });

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollHints({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateScrollHints();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollHints, { passive: true });
    const observer = new ResizeObserver(updateScrollHints);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollHints);
      observer.disconnect();
    };
  }, [open, updateScrollHints, tabs.length]);

  useEffect(() => {
    if (!open) return;
    const activeEl = tabRefs.current.get(activeTab);
    activeEl?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeTab, open]);

  const scrollTabs = (direction: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: direction * 128, behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "arena-menu-tabs-wrap",
        scrollHints.left && "arena-menu-tabs-wrap--fade-left",
        scrollHints.right && "arena-menu-tabs-wrap--fade-right",
      )}
    >
      {scrollHints.left ? (
        <button
          type="button"
          className="arena-menu-tabs-chevron arena-menu-tabs-chevron--left"
          aria-label="Scroll tabs left"
          onClick={() => scrollTabs(-1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      ) : null}

      <div
        ref={scrollRef}
        className="arena-menu-tabs"
        role="tablist"
        aria-label="Arena menu sections"
      >
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            ref={(node) => {
              if (node) tabRefs.current.set(id, node);
              else tabRefs.current.delete(id);
            }}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => onTabChange(id)}
            className={cn(
              "arena-menu-tab",
              activeTab === id
                ? "arena-menu-tab-active"
                : "text-[var(--arena-muted)] hover:bg-[var(--arena-surface-2)]/80 hover:text-[var(--arena-text)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {scrollHints.right ? (
        <button
          type="button"
          className="arena-menu-tabs-chevron arena-menu-tabs-chevron--right"
          aria-label="Scroll tabs right"
          onClick={() => scrollTabs(1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
