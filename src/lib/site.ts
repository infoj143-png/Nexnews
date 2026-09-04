export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://nexnews-nu.vercel.app').replace(/\/$/, '');
}
