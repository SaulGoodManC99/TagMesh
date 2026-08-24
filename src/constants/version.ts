declare const __APP_VERSION__: string | undefined;
declare const __BUILD_TIME__: string | undefined;

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'v1.7.2';
export const BUILD_TIME_RAW = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();

export function getFormattedBuildTime(locale: string = 'zh'): string {
  try {
    const d = new Date(BUILD_TIME_RAW);
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());

    if (locale === 'zh') {
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return BUILD_TIME_RAW;
  }
}
