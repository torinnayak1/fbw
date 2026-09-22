export const LOCK_AT = new Date("2026-09-23T06:59:59.999Z");

export function isLocked(now: Date = new Date()): boolean {
  return now.getTime() >= LOCK_AT.getTime();
}

export function lockLabel(): string {
  return "Tue Sep 22, 2026 · 11:59 PM Pacific";
}
