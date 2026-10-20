/** Format precise timestamps into relative Spanish labels, preserving legacy text dates. */
export function formatPortalDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const timeZone = 'America/Argentina/Buenos_Aires';
  const calendarParts = (target: Date) => new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone,
  }).formatToParts(target).reduce<Record<string, string>>((parts, part) => {
    if (part.type !== 'literal') parts[part.type] = part.value;
    return parts;
  }, {});
  const eventParts = calendarParts(date);
  const todayParts = calendarParts(new Date());
  const eventDay = Date.UTC(Number(eventParts.year), Number(eventParts.month) - 1, Number(eventParts.day));
  const todayDay = Date.UTC(Number(todayParts.year), Number(todayParts.month) - 1, Number(todayParts.day));
  const daysAgo = Math.round((todayDay - eventDay) / 86400000);
  const time = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone,
  }).format(date);
  if (daysAgo === 0) return `Hoy · ${time}`;
  if (daysAgo === 1) return `Ayer · ${time}`;
  const dateLabel = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: 'short', ...(eventParts.year !== todayParts.year ? { year: 'numeric' as const } : {}), timeZone,
  }).format(date).replace('.', '');
  return `${dateLabel} · ${time}`;
}
