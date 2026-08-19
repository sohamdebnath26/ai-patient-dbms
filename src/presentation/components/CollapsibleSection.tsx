import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  icon,
  badge,
  defaultOpen = false,
  collapsible = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const showContent = collapsible ? open : true;

  const header = (
    <div className="flex items-center gap-3">
      {icon && <span className="text-brand-600">{icon}</span>}
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {badge}
    </div>
  );

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {collapsible ? (
        <button
          type="button"
          onClick={() => {
            setOpen((prev) => !prev);
          }}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          {header}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      ) : (
        <div className="flex items-center justify-between gap-3 px-5 py-4">{header}</div>
      )}
      {showContent && <div className="border-t border-gray-100 px-5 py-5">{children}</div>}
    </section>
  );
}
