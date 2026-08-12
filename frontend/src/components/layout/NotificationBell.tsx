"use client";

// Tombol lonceng + panel pengingat. Membaca dari store (notifications di-load
// saat bootstrap oleh AppShell). Klik item -> tandai dibaca + arahkan ke
// targetUrl (deep link task). "Tutup" (X) = snooze 24 jam (dismissNotification).
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlarmClock,
  AlertTriangle,
  Bell,
  BellRing,
  CheckCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTrexo, selectUnreadNotificationCount } from "@/lib/store";
import {
  NOTIF_SEVERITY_META,
  type Notification,
  type NotificationSeverity,
} from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

// Ikon per severity (warna diambil dari NOTIF_SEVERITY_META).
const SEVERITY_ICON: Record<NotificationSeverity, LucideIcon> = {
  urgent: AlertTriangle,
  warning: AlarmClock,
  info: BellRing,
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const notifications = useTrexo((s) => s.notifications);
  const unread = useTrexo(selectUnreadNotificationCount);
  const loadNotifications = useTrexo((s) => s.loadNotifications);
  const markRead = useTrexo((s) => s.markNotificationRead);
  const markAllRead = useTrexo((s) => s.markAllNotificationsRead);
  const dismiss = useTrexo((s) => s.dismissNotification);

  // Tutup panel saat klik di luar / tekan Escape (sama pola dengan Dropdown).
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void loadNotifications(); // segarkan daftar tiap buka
  };

  const handleClickItem = (n: Notification) => {
    if (!n.isRead) markRead(n.id);
    setOpen(false);
    router.push(n.targetUrl);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted"
        aria-label="Notifikasi"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-[min(92vw,380px)] origin-top-right animate-scale-in overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-lift">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Notifikasi</span>
              {unread > 0 && (
                <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  {unread} baru
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tandai dibaca
              </button>
            )}
          </div>

          {/* Daftar */}
          {notifications.length === 0 ? (
            <div className="p-3">
              <EmptyState
                icon={<Bell className="h-5 w-5" />}
                title="Tidak ada notifikasi"
                description="Pengingat task yang mendekati jatuh tempo akan muncul di sini."
                className="border-0 bg-transparent py-10"
              />
            </div>
          ) : (
            <ul className="scrollbar-thin max-h-[60vh] overflow-y-auto">
              {notifications.map((n) => {
                const meta = NOTIF_SEVERITY_META[n.severity];
                const Icon = SEVERITY_ICON[n.severity];
                return (
                  <li key={n.id} className="group relative">
                    <button
                      onClick={() => handleClickItem(n)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted",
                        !n.isRead && "bg-muted/40",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
                          meta.bg,
                          meta.ring,
                        )}
                      >
                        <Icon className={cn("h-4 w-4", meta.icon)} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">{n.title}</span>
                          {!n.isRead && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden />
                          )}
                        </span>
                        <span className="line-clamp-1 text-xs text-muted-foreground">{n.body}</span>
                        {n.dueAt && (
                          <span className={cn("mt-0.5 inline-block text-[11px] font-medium", meta.text)}>
                            {formatRelative(n.dueAt)}
                          </span>
                        )}
                      </span>
                    </button>

                    {/* Tutup / snooze 24 jam */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismiss(n.id);
                      }}
                      className="absolute right-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                      aria-label="Sembunyikan notifikasi"
                      title="Sembunyikan 24 jam"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
