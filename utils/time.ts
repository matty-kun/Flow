export function formatTimestamp(unixTimeMs: number): string {
  const date = new Date(unixTimeMs);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); // e.g., "3:00 PM"
}

export function formatDate(unixTimeMs: number): string {
  const date = new Date(unixTimeMs);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }); // e.g., "Oct 13"
}

export function formatDuration(durationMins: number): string {
  if (durationMins < 60) return `${durationMins}m`;
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  return `${hours}h ${mins}m`;
}

export function formatLogDuration(startTimeMs: number, endTimeMs: number | null, fallbackDurationSecs: number | null): string {
  const end = endTimeMs || (fallbackDurationSecs ? startTimeMs + fallbackDurationSecs * 1000 : Date.now());
  const diffSecs = Math.max(0, Math.floor((end - startTimeMs) / 1000));

  const hours = Math.floor(diffSecs / 3600);
  const mins = Math.floor((diffSecs % 3600) / 60);
  const secs = diffSecs % 60;

  if (hours > 0) {
    if (mins > 0 && secs > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${hours}h ${mins}m`;
    return `${hours}h`;
  }
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${secs}s`;
}

export function formatLiveDuration(startTimeMs: number, currentTimeMs: number): string {
  return formatLogDuration(startTimeMs, currentTimeMs, null);
}
