import { TestimonialsCarousel } from "@/components/shared/testimonials-carousel";

export default function StoriesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-14">
      <div className="mb-8 space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Testimonials
        </p>
        <h1 className="text-3xl font-semibold">Stories from our student community</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Real voices from students, advisors, and parents using UniCare across Sri Lankan campuses.
        </p>
      </div>
      <TestimonialsCarousel
        testimonials={[
          {
            name: "Sachithra Wijesinghe",
            title: "Final-year Engineering Student, University of Colombo",
            quote:
              "UniCare helped me secure an emergency grant and a campus job in the same month.",
            avatar: "/sachithra.jpeg",
            image: "/sachithra.jpeg"
          },
          {
            name: "Imasha Ransinghe",
            title: "Career Advisor, University of Moratuwa",
            quote:
              "The platform gives students clear internship pathways and helps advisors intervene early.",
            avatar: "/imasha.jpeg",
            image: "/imasha.jpeg"
          },
          {
            name: "Kusum Karunarathna",
            title: "Parent Community Mentor, University of Peradeniya",
            quote:
              "Counseling support and regular mentor check-ins helped my son stay focused and confident.",
            avatar: "/kusum.jpeg",
            image: "/kusum.jpeg"
          }
        ]}
      />
    </div>
  );
}
