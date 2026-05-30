import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SidebarSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function SidebarSection({ title, children, className }: SidebarSectionProps) {
  return (
    <section className={cn("space-y-2", className)}>
      <h2 className="px-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/90">
        {title}
      </h2>
      {children}
    </section>
  );
}
