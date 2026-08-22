/**
 * Format timestamp into 24-hour full date and time string
 * e.g., 2026年08月22日 22:15:30 (zh) or 2026-08-22 22:15:30 (en)
 */
export function format24HourDateTime(
  timestamp?: number | string | Date | null,
  locale: string = 'zh'
): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  if (locale === 'zh') {
    return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
  }
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatShort24HourDateTime(
  timestamp?: number | string | Date | null,
  locale: string = 'zh'
): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  if (locale === 'zh') {
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  }
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
