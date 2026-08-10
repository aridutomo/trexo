import { cn } from "@/lib/utils";

/** Mark Trexo — kaki (claw) stylized yang menyiratkan progres & "trex". */
export function TrexoLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="trexo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2196f3" />
          <stop offset="1" stopColor="#1565c0" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#trexo-grad)" />
      {/* telapak */}
      <ellipse cx="24" cy="29" rx="9" ry="8" fill="white" />
      {/* cakar */}
      <circle cx="13" cy="18" r="3.4" fill="white" />
      <circle cx="24" cy="13" r="3.4" fill="white" />
      <circle cx="35" cy="18" r="3.4" fill="white" />
    </svg>
  );
}

export function TrexoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <TrexoLogo className="h-8 w-8" />
      <span className="text-lg font-bold tracking-tight text-slate-900">Trexo</span>
    </span>
  );
}

export function TrexoWordmarkLight({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <TrexoLogo className="h-8 w-8" />
      <span className="text-lg font-bold tracking-tight text-white">Trexo</span>
    </span>
  );
}
