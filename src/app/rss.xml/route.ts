import { GET as getFeed } from '../feed.xml/route';

export const revalidate = 300;

export async function GET() {
  return getFeed();
}
