"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQ_ITEMS } from "@/data/faq";

export function FaqSection({ limit }: { limit?: number }) {
  const items = limit ? FAQ_ITEMS.slice(0, limit) : FAQ_ITEMS;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={item.q}
          className="rounded-2xl border border-slate-100 bg-white overflow-hidden"
        >
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-slate-900"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            {item.q}
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-slate-400 transition",
                open === i && "rotate-180",
              )}
            />
          </button>
          {open === i && (
            <p className="border-t border-slate-50 px-5 pb-4 text-sm leading-relaxed text-slate-600">
              {item.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
