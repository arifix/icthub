export const stripHtmlAndTruncate = (html, limit = 50) => {
  const tempElement = document.createElement("div");
  tempElement.innerHTML = html;
  const text = tempElement.textContent || tempElement.innerText || "";
  return text.length > limit ? text.substring(0, limit) + "…" : text;
};

export const isPastDate = (date) => {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  return targetDate < today;
};
