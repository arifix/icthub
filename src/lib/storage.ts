// localStorage can throw (private mode, blocked storage); never let that break the UI.

export const readJSON = <T>(key: string, fallback: T, isValid?: (value: unknown) => boolean): T => {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return !isValid || isValid(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJSON = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

export const removeKey = (key: string) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

export const isNumberArray = (value: unknown): boolean =>
  Array.isArray(value) && value.every((item) => typeof item === "number");
