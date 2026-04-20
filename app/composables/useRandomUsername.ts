const STORAGE_KEY = "ds-terminal-user";

export function useRandomUsername(): string {
  if (typeof window === "undefined") return "";
  let stored = window.sessionStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const n = Math.floor(Math.random() * 90000) + 10000;
    stored = `user${n}`;
    window.sessionStorage.setItem(STORAGE_KEY, stored);
  }
  return stored;
}
