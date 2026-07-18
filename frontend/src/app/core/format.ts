/** Presentation helpers shared across shift views. */

export function formatDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateTime(iso: string): string {
  return `${formatDay(iso)} · ${formatTime(iso)}`;
}

export function openSlots(capacity: number, filled: number): number {
  return Math.max(0, capacity - filled);
}
