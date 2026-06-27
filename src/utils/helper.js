export const stripHtmlAndTruncate = (html, limit = 50) => {
  const tempElement = document.createElement("div");
  tempElement.innerHTML = html;
  const text = tempElement.textContent || tempElement.innerText || "";
  return text.length > limit ? text.substring(0, limit) + "…" : text;
};
