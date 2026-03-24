"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { useLanguage } from "@/context/language-context";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          invalid: "වලංගු විද්‍යුත් තැපෑලක් ඇතුල් කරන්න.",
          sent: "මුරපද යළි සැකසුම් සබැඳිය ඔබගේ විද්‍යුත් තැපෑලට යවා ඇත.",
          failed: "දැනට යළි සැකසුම් සබැඳිය යැවිය නොහැක. කරුණාකර නැවත උත්සාහ කරන්න.",
          title: "ඔබගේ මුරපදය යළි සකසන්න",
          subtitle: "ඔබගේ විද්‍යුත් තැපෑලට යළි සැකසුම් සබැඳිය යවන්නෙමු.",
          email: "විද්‍යුත් තැපෑල",
          submit: "යළි සැකසුම් සබැඳිය යවන්න"
        }
      : language === "ta"
        ? {
            invalid: "சரியான மின்னஞ்சலை உள்ளிடவும்.",
            sent: "கடவுச்சொல் மீட்டமைப்பு இணைப்பு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது.",
            failed: "தற்போது மீட்டமைப்பு இணைப்பை அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
            title: "உங்கள் கடவுச்சொல்லை மீட்டமைக்கவும்",
            subtitle: "உங்கள் மின்னஞ்சலுக்கு மீட்டமைப்பு இணைப்பை அனுப்புவோம்.",
            email: "மின்னஞ்சல்",
            submit: "மீட்டமைப்பு இணைப்பை அனுப்பவும்"
          }
        : {
            invalid: "Please enter a valid email.",
            sent: "Password reset link sent to your email.",
            failed: "Unable to send reset link right now. Please try again.",
            title: "Reset your password",
            subtitle: "We will send a reset link to your email.",
            email: "Email",
            submit: "Send reset link"
          };
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    if (!email) {
      setMessage(text.invalid);
      return;
    }

    try {
      await requestPasswordReset(email);
      setMessage(text.sent);
    } catch {
      setMessage(text.failed);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{text.title}</h1>
        <p className="text-sm text-slate-500">{text.subtitle}</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            {text.email}
          </label>
          <Input id="email" name="email" type="email" required aria-required="true" />
        </div>
        {message ? <p className="text-sm text-secondary">{message}</p> : null}
        <Button type="submit">{text.submit}</Button>
      </form>
    </div>
  );
}
