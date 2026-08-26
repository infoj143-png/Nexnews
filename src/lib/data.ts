export type Category = 'Tech' | 'World' | 'Business' | 'AI' | 'Sports';

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: Category;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishedAt: string;
  readTime: string;
  imageUrl: string;
  imageCaption?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isBreaking?: boolean;
  views: number;
  status: 'published' | 'draft' | 'archived';
  tags: string[];
  aiGenerated?: boolean;
}

export interface AnalyticsData {
  totalViews: number;
  totalArticles: number;
  publishedCount: number;
  draftCount: number;
  estimatedRevenue: number;
  viewsByDay: { date: string; views: number }[];
  categoryDistribution: { category: Category; count: number }[];
}

export const CATEGORIES: Category[] = ['Tech', 'World', 'Business', 'AI', 'Sports'];

let initialArticles: Article[] = [
  {
    id: '1',
    title: 'OpenAI Unveils GPT-5: A Quantum Leap in Autonomous Reasoning and Multimodal Intelligence',
    slug: 'openai-unveils-gpt-5-quantum-leap-reasoning',
    summary: 'The latest flagship AI model introduces breakthrough zero-shot problem solving capabilities and instant code generation across complex systems.',
    content: `
      <p class="mb-4">SAN FRANCISCO — OpenAI has officially introduced GPT-5, marking one of the most significant milestones in artificial intelligence history. Designed from the ground up to achieve native multimodal comprehension and autonomous reasoning, GPT-5 outperforms previous benchmarks by over 40% across mathematical, scientific, and software architecture domains.</p>

      <h2 class="text-2xl font-bold mt-6 mb-3">Architectural Innovations</h2>
      <p class="mb-4">Unlike its predecessors, GPT-5 integrates real-time self-verification mechanisms. When tasked with complex multi-step problems, the network runs parallel verification trees to check for logical fallacies before formulating its final output. This dramatically reduces hallucinations to near-zero levels in enterprise code generation and legal analysis.</p>

      <blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-gray-700 font-serif">
        "GPT-5 is not just bigger; it is fundamentally more reflective. It contemplates problem spaces much like human domain experts do before making assertions."
      </blockquote>

      <h2 class="text-2xl font-bold mt-6 mb-3">Enterprise & Developer Impact</h2>
      <p class="mb-4">Developers can deploy agents capable of maintaining persistent state across complex codebases. Initial benchmark evaluations show full repository refactoring accuracy exceeding 92%, drastically lowering standard software delivery lifecycles from weeks to hours.</p>

      <p class="mb-4">As tech giants race to integrate GPT-5 into global infrastructure, questions around energy efficiency and algorithmic safety remain at the center of international policy discussions.</p>
    `,
    category: 'AI',
    author: {
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      role: 'Senior Tech Correspondent'
    },
    publishedAt: '2025-02-26T08:30:00Z',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Abstract visualization of neural network synaptic pathways during GPT-5 benchmark testing.',
    isFeatured: true,
    isTrending: true,
    isBreaking: true,
    views: 45200,
    status: 'published',
    tags: ['AI', 'OpenAI', 'GPT-5', 'Tech News', 'Machine Learning'],
    aiGenerated: true
  },
  {
    id: '2',
    title: 'Global Markets Rally as Central Banks Signal Unified Rate Cuts',
    slug: 'global-markets-rally-central-banks-rate-cuts',
    summary: 'Major indices surged following coordinated announcements from European and American fiscal authorities citing stabilizing inflation trends.',
    content: `
      <p class="mb-4">NEW YORK / LONDON — Global equity markets posted historic single-day gains on Wednesday after central banks across North America and Europe delivered a unified policy shift signal. Investors responded enthusiastically to indications of controlled inflation trajectories and sustained economic resilience.</p>

      <p class="mb-4">The S&P 500 jumped 2.4%, while the FTSE 100 and DAX surged 1.9% and 2.2% respectively. High-growth technology stocks led the rally, boosted by lower capital borrowing expectations.</p>

      <h2 class="text-2xl font-bold mt-6 mb-3">Analyst Reactions</h2>
      <p class="mb-4">Market strategists emphasize that while short-term liquidity is expected to improve, corporate earnings reports in Q2 will remain the ultimate validator of valuation stability.</p>
    `,
    category: 'Business',
    author: {
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      role: 'Chief Financial Analyst'
    },
    publishedAt: '2025-02-26T07:15:00Z',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Financial trading floor displays displaying positive market trajectories.',
    isFeatured: true,
    isTrending: true,
    isBreaking: false,
    views: 28400,
    status: 'published',
    tags: ['Economy', 'Markets', 'Finance', 'Interest Rates', 'Business'],
    aiGenerated: false
  },
  {
    id: '3',
    title: 'Next-Gen Solid State Battery Achieves 1,000 Mile Range in EV Road Test',
    slug: 'solid-state-battery-achieves-1000-mile-range-ev',
    summary: 'A automotive tech consortium demonstrated a commercial-grade battery pack charging in under 10 minutes with zero thermal degradation.',
    content: `
      <p class="mb-4">STUTTGART — Automotive engineering hit a long-anticipated milestone today as a breakthrough solid-state battery pack completed a continuous 1,000-mile real-world drive on a single charge. Tested under varying weather conditions from sub-zero mountain passes to high-speed highway cruising, the battery maintained top-tier output efficiency throughout.</p>

      <p class="mb-4">Fast-charging capability was also proven in laboratory conditions, reaching 80% capacity in 8.5 minutes using standard ultra-fast chargers.</p>
    `,
    category: 'Tech',
    author: {
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      role: 'Clean Energy & Auto Writer'
    },
    publishedAt: '2025-02-26T06:00:00Z',
    readTime: '5 min read',
    imageUrl: 'https://images.unsplash.com/photo-1558441719-6705546fe49d?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Futuristic electric vehicle chassis undergoing chassis and battery testing.',
    isFeatured: true,
    isTrending: true,
    isBreaking: false,
    views: 31900,
    status: 'published',
    tags: ['EV', 'Batteries', 'Tech', 'Innovation', 'Automotive'],
    aiGenerated: false
  },
  {
    id: '4',
    title: 'International Space Summit Agrees on New Lunar Exploration Protocol',
    slug: 'international-space-summit-agrees-lunar-protocol',
    summary: 'Delegates from 24 spacefaring nations signed agreements governing orbital resource allocation and permanent scientific moon bases.',
    content: `
      <p class="mb-4">GENEVA — Representatives from 24 global space agencies have ratified the Geneva Lunar Accord, establishing comprehensive rules for resource allocation, communication relay frequencies, and safety zones around scientific outposts on the Moon.</p>

      <p class="mb-4">The agreement is regarded as the most detailed space treaty since the 1967 Outer Space Treaty, paving the way for sustainable commercial and scientific expansion.</p>
    `,
    category: 'World',
    author: {
      name: 'David O\'Connor',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      role: 'Diplomatic Affairs Correspondent'
    },
    publishedAt: '2025-02-25T18:45:00Z',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Earth and Moon viewed from orbital scientific laboratory space station.',
    isFeatured: false,
    isTrending: true,
    isBreaking: false,
    views: 19800,
    status: 'published',
    tags: ['Space', 'World', 'Science', 'Diplomacy'],
    aiGenerated: false
  },
  {
    id: '5',
    title: 'Champions League Thriller: Underdogs Stun Champions with 94th Minute Winner',
    slug: 'champions-league-thriller-underdogs-stun-champions-94th-minute',
    summary: 'A spectacular stoppage-time bicycle kick sealed an astonishing comeback, sending stadium fans into euphoria.',
    content: `
      <p class="mb-4">MADRID — In one of the most memorable European football nights of the decade, FC Porto produced a heroic performance to overthrow the reigning European champions in a dramatic 3-2 victory.</p>

      <p class="mb-4">Down 2-1 in extra time, two rapid goals in the final minutes culminated in an acrobatic volley in the 94th minute, securing their place in the quarter-finals.</p>
    `,
    category: 'Sports',
    author: {
      name: 'Carlos Mendez',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      role: 'Global Sports Journalist'
    },
    publishedAt: '2025-02-25T22:10:00Z',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Stadium floodlights shining on the pitch during high-stakes football tournament.',
    isFeatured: false,
    isTrending: false,
    isBreaking: false,
    views: 14200,
    status: 'published',
    tags: ['Football', 'Sports', 'ChampionsLeague', 'Soccer'],
    aiGenerated: false
  },
  {
    id: '6',
    title: 'Autonomous AI Agents Take Over Software Quality Assurance Testing',
    slug: 'autonomous-ai-agents-take-over-software-qa-testing',
    summary: 'Engineering teams report 80% decrease in regression bugs using autonomous synthetic user agents.',
    content: `
      <p class="mb-4">SEATTLE — Tech firms are shifting testing paradigms away from traditional scripted selenium tests toward autonomous AI agents that act like human users across edge cases.</p>

      <p class="mb-4">By continuously interacting with app builds, these autonomous systems generate bug reports complete with visual repro steps and PR code fixes.</p>
    `,
    category: 'AI',
    author: {
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      role: 'Senior Tech Correspondent'
    },
    publishedAt: '2025-02-24T14:20:00Z',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Code screen showcasing automated AI test suite execution log.',
    isFeatured: false,
    isTrending: true,
    isBreaking: false,
    views: 22100,
    status: 'published',
    tags: ['AI', 'Software', 'DevOps', 'Testing'],
    aiGenerated: true
  }
];

// Helper functions to manage state in memory
export function getArticles(): Article[] {
  return initialArticles;
}

export function getArticleBySlug(slug: string): Article | undefined {
  return initialArticles.find(a => a.slug === slug);
}

export function getArticlesByCategory(category: Category): Article[] {
  return initialArticles.filter(a => a.category.toLowerCase() === category.toLowerCase() && a.status === 'published');
}

export function searchArticles(query: string): Article[] {
  const q = query.toLowerCase();
  return initialArticles.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.summary.toLowerCase().includes(q) ||
    a.tags.some(t => t.toLowerCase().includes(q))
  );
}

export function addArticle(article: Omit<Article, 'id' | 'views'>): Article {
  const newArticle: Article = {
    ...article,
    id: Date.now().toString(),
    views: 0,
  };
  initialArticles = [newArticle, ...initialArticles];
  return newArticle;
}

export function updateArticle(id: string, updates: Partial<Article>): Article | null {
  const index = initialArticles.findIndex(a => a.id === id);
  if (index === -1) return null;
  initialArticles[index] = { ...initialArticles[index], ...updates };
  return initialArticles[index];
}

export function deleteArticle(id: string): boolean {
  const initialLen = initialArticles.length;
  initialArticles = initialArticles.filter(a => a.id !== id);
  return initialArticles.length < initialLen;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

export function getAnalytics(): AnalyticsData {
  const totalViews = initialArticles.reduce((acc, item) => acc + item.views, 0);
  const publishedCount = initialArticles.filter(a => a.status === 'published').length;
  const draftCount = initialArticles.filter(a => a.status === 'draft').length;
  const estimatedRevenue = Number((totalViews * 0.0035 + publishedCount * 12.5).toFixed(2));

  const categoryDistribution = CATEGORIES.map(cat => ({
    category: cat,
    count: initialArticles.filter(a => a.category === cat).length
  }));

  const viewsByDay = [
    { date: 'Mon', views: 12400 },
    { date: 'Tue', views: 15800 },
    { date: 'Wed', views: 22100 },
    { date: 'Thu', views: 18900 },
    { date: 'Fri', views: 25400 },
    { date: 'Sat', views: 28900 },
    { date: 'Sun', views: 31200 },
  ];

  return {
    totalViews,
    totalArticles: initialArticles.length,
    publishedCount,
    draftCount,
    estimatedRevenue,
    viewsByDay,
    categoryDistribution
  };
}
