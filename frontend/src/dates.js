// Expiry dates are stored as UTC instants. Dates entered in the form are
// calendar days at UTC midnight, so they are displayed in UTC as well.

const DAY_MS = 24 * 60 * 60 * 1000;

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function formatDate(iso) {
  return dateFormat.format(new Date(iso));
}

// "YYYY-MM-DD" for an <input type="date">.
export function toDateInputValue(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// "N days left" or "N days overdue", computed in the browser.
export function daysLeftLabel(iso, now = new Date()) {
  const diff = new Date(iso).getTime() - now.getTime();
  if (diff >= 0) {
    const days = Math.floor(diff / DAY_MS);
    return days === 0 ? "Expires today" : `${plural(days, "day")} left`;
  }
  return `${plural(Math.ceil(-diff / DAY_MS), "day")} overdue`;
}
