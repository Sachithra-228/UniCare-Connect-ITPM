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

export function getDemoDonorRecognitionOverview() {
  const stories: DemoRecognitionStory[] = [
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

  const metrics: DemoRecognitionMetrics = {
    featuredStories: stories.length,
    studentTestimonials: 4,
    anonymizedHighlights: 8,
    engagementRate: 72
  };

  return {
    metrics,
    stories
  };
}
