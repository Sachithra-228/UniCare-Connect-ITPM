"use client";

import { useEffect } from "react";
import { Button } from "@/components/shared/button";
import { useLanguage } from "@/context/language-context";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "යම් දෝෂයක් සිදුවී ඇත",
          body: "කරුණාකර නැවත උත්සාහ කරන්න, හෝ ගැටළුව දිගටම පවතී නම් සහාය අමතන්න.",
          retry: "නැවත උත්සාහ කරන්න"
        }
      : language === "ta"
        ? {
            title: "ஏதோ தவறு ஏற்பட்டுள்ளது",
            body: "மீண்டும் முயற்சிக்கவும் அல்லது பிரச்சினை தொடர்ந்தால் ஆதரவை தொடர்புகொள்ளவும்.",
            retry: "மீண்டும் முயற்சிக்கவும்"
          }
        : {
            title: "Something went wrong",
            body: "Please try again or contact support if the issue persists.",
            retry: "Retry"
          };

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-semibold">{text.title}</h1>
      <p className="text-sm text-slate-500">{text.body}</p>
      <Button onClick={reset}>{text.retry}</Button>
    </div>
  );
}
