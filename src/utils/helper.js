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

export const getUpcomingEventAlert = (events) => {
  const now = new Date();
  const messages = [];

  const labels = ["Today", "Tomorrow", "Day after tomorrow"];

  const startIndex = now.getHours() >= 17 ? 1 : 0;

  for (let i = startIndex; i < 3; i++) {
    const target = new Date(now);
    target.setHours(0, 0, 0, 0);
    target.setDate(target.getDate() + i);

    const targetISO = new Date(
      target.getTime() - target.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split("T")[0];

    const dayEvents = events.filter(
      (event) => event.is_active && event.date === targetISO,
    );

    if (!dayEvents.length) continue;

    messages.push({
      label: labels[i],
      date: targetISO,
      count: dayEvents.length,
      events: dayEvents,
    });
  }

  return messages;
};
