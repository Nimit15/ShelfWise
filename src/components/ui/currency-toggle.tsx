"use client";

interface CurrencyToggleProps {
  currency: "INR" | "USD";
  onChange: (currency: "INR" | "USD") => void;
}

export function CurrencyToggle({ currency, onChange }: CurrencyToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-[var(--ca-slate-light)] p-1 text-xs">
      <button
        onClick={() => onChange("INR")}
        className={`rounded-full px-3 py-1 font-medium transition-all ${
          currency === "INR"
            ? "bg-[var(--ca-amber)] text-[var(--ca-slate)]"
            : "text-[var(--ca-text-secondary)] hover:text-[var(--ca-text-primary)]"
        }`}
      >
        ₹ INR
      </button>
      <button
        onClick={() => onChange("USD")}
        className={`rounded-full px-3 py-1 font-medium transition-all ${
          currency === "USD"
            ? "bg-[var(--ca-amber)] text-[var(--ca-slate)]"
            : "text-[var(--ca-text-secondary)] hover:text-[var(--ca-text-primary)]"
        }`}
      >
        $ USD
      </button>
    </div>
  );
}
