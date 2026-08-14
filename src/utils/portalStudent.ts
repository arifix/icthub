const PORTAL_STUDENT_NAME_KEY = "ict_portal_student_name";

const normalizeStudentName = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

export const getStoredStudentName = (): string | null => {
  const raw = window.localStorage.getItem(PORTAL_STUDENT_NAME_KEY);
  if (!raw) return null;
  const normalized = normalizeStudentName(raw);
  return normalized ? normalized : null;
};

export const persistStudentName = (name: string): string => {
  const normalized = normalizeStudentName(name);
  window.localStorage.setItem(PORTAL_STUDENT_NAME_KEY, normalized);
  return normalized;
};

export const clearStoredStudentName = () => {
  window.localStorage.removeItem(PORTAL_STUDENT_NAME_KEY);
};
