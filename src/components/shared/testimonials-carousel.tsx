"use client";

import Image from "next/image";
import { useState } from "react";

type Testimonial = {
  name: string;
  title: string;
  quote: string;
  avatar: string;
  image: string;
};

export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="space-y-4">
      <div className="hidden gap-4 lg:flex">
        {testimonials.map((testimonial, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={testimonial.name}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`group relative h-[560px] overflow-hidden rounded-3xl border text-left transition-all duration-700 ease-out ${
                isActive
                  ? "flex-[1.2] border-primary/40 bg-slate-950 text-white shadow-lg"
                  : "flex-1 border-slate-200 bg-white shadow-sm hover:border-primary/30"
              }`}
            >
              {isActive ? (
                <>
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 space-y-3 p-6">
                    <p className="max-w-[42ch] text-lg font-semibold leading-7">&ldquo;{testimonial.quote}&rdquo;</p>
                    <div>
                      <p
                        className="text-5xl leading-none"
                        style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
                      >
                        {testimonial.name}
                      </p>
                      <p className="mt-2 text-sm text-white/85">{testimonial.title}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col p-7">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="mt-8 space-y-4">
                    <p className="text-3xl leading-none text-primary/35">&ldquo;</p>
                    <p className="text-2xl font-semibold leading-8 text-slate-900">{testimonial.quote}</p>
                  </div>

                  <div className="mt-auto pt-8">
                    <p
                      className="text-5xl leading-none text-slate-900"
                      style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
                    >
                      {testimonial.name}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{testimonial.title}</p>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:hidden">
        {testimonials.map((testimonial, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={`${testimonial.name}-mobile`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`overflow-hidden rounded-3xl border text-left transition-all duration-500 ${
                isActive
                  ? "border-primary/40 bg-slate-950 text-white"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="relative h-64">
                <Image
                  src={isActive ? testimonial.image : testimonial.avatar}
                  alt={testimonial.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-lg font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-white/85">{testimonial.title}</p>
                </div>
              </div>
              {isActive ? (
                <p className="p-4 text-sm leading-6 text-white/90">&ldquo;{testimonial.quote}&rdquo;</p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
