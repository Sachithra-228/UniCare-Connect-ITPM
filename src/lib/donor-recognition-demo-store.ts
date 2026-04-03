export type DemoRecognitionStory = {
  id: string;
  title: string;
  summary: string;
  category: string;
  date: string;
};

export type DemoRecognitionMetrics = {
  featuredStories: number;
  studentTestimonials: number;
  anonymizedHighlights: number;
  engagementRate: number;
};

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return `demo-story-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

let demoRecognitionStories: DemoRecognitionStory[] = [
  {
    id: "demo-story-1",
    title: "First-gen graduate from rural district",
    summary: "Emergency tuition support helped this student complete their degree on time.",
    category: "Tuition support",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString()
  },
  {
    id: "demo-story-2",
    title: "STEM scholar builds community robotics club",
    summary: "Equipment funding enabled hands-on learning for dozens of younger students.",
    category: "Equipment support",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
  }
];

function toMetrics(stories: DemoRecognitionStory[]): DemoRecognitionMetrics {
  const studentTestimonials = Math.max(4, stories.length * 2);
  const anonymizedHighlights = Math.max(8, stories.length * 3);
  const engagementRate = Math.min(96, 58 + stories.length * 7);
  return {
    featuredStories: stories.length,
    studentTestimonials,
    anonymizedHighlights,
    engagementRate
  };
}

export function listDemoDonorRecognitionStories() {
  return demoRecognitionStories
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((item) => ({ ...item }));
}

export function addDemoDonorRecognitionStory(
  input: Omit<DemoRecognitionStory, "id" | "date"> & { date?: string }
) {
  const created: DemoRecognitionStory = {
    id: makeId(),
    title: input.title,
    summary: input.summary,
    category: input.category,
    date: input.date ?? nowIso()
  };
  demoRecognitionStories = [created, ...demoRecognitionStories];
  return { ...created };
}

export function updateDemoDonorRecognitionStory(
  id: string,
  input: Partial<Pick<DemoRecognitionStory, "title" | "summary" | "category">>
) {
  const index = demoRecognitionStories.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const next: DemoRecognitionStory = {
    ...demoRecognitionStories[index],
    ...input,
    date: nowIso()
  };
  demoRecognitionStories[index] = next;
  return { ...next };
}

export function deleteDemoDonorRecognitionStory(id: string) {
  const index = demoRecognitionStories.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const [removed] = demoRecognitionStories.splice(index, 1);
  return { ...removed };
}

export function getDemoDonorRecognitionOverview() {
  const stories = listDemoDonorRecognitionStories();
  return {
    metrics: toMetrics(stories),
    stories
  };
}
