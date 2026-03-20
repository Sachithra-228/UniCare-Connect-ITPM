"use client";

import { useState } from "react";
import { aidRequestSchema } from "@/lib/validation";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { Select } from "@/components/shared/select";
import { TextArea } from "@/components/shared/text-area";
import { useLanguage } from "@/context/language-context";

type AidRequestFormProps = { onSuccess?: () => void; onShowSuccessPopup?: () => void };

const FETCH_TIMEOUT_MS = 60000;

export function AidRequestForm({ onSuccess, onShowSuccessPopup }: AidRequestFormProps) {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          invalid: "අවශ්‍ය ක්ෂේත්‍ර පුරවා විස්තරාත්මක පැහැදිලි කිරීමක් එක් කරන්න.",
          submitFailed: "ඔබගේ ඉල්ලීම යැවීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.",
          submitted: "ඔබගේ අයදුම්පත විශ්වවිද්‍යාල සත්‍යාපනය සඳහා යවා ඇත.",
          requestSent:
            "ඉල්ලීම යවා ඇත. පහළ ලැයිස්තුවේ අයදුම්පත පෙනේ නම් සාර්ථකව යවා ඇත. නොපෙනේ නම් නැවත උත්සාහ කරන්න.",
          networkFail: "ඉල්ලීම යැවීමට නොහැකි විය. සම්බන්ධතාවය පරීක්ෂා කර නැවත උත්සාහ කරන්න.",
          category: "ආධාර ප්‍රවර්ගය",
          select: "තෝරන්න",
          emergency: "හදිසි අධ්‍යයන ආධාර",
          equipment: "උපාංග සහ සම්පත්",
          boarding: "නවාතැන් සහ දෛනික අවශ්‍යතා",
          tuition: "පාඨමාලා සහ නඩත්තු ආධාර",
          amount: "ඇස්තමේන්තු මුදල (SL LKR)",
          summary: "තත්ව සාරාංශය",
          summaryPlaceholder: "අවශ්‍යතාව පැහැදිලි කර සහායක ලේඛන උඩුගත කරන්න.",
          documents: "සහායක ලේඛන",
          uploadAria: "ලේඛන උඩුගත කරන්න",
          submitting: "යවමින්...",
          submit: "අයදුම්පත යවන්න"
        }
      : language === "ta"
        ? {
            invalid: "தேவையான புலங்களை நிரப்பி விரிவான விளக்கத்தை சேர்க்கவும்.",
            submitFailed: "உங்கள் கோரிக்கையை சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
            submitted: "உங்கள் விண்ணப்பம் பல்கலைக்கழக சரிபார்ப்பிற்கு சமர்ப்பிக்கப்பட்டது.",
            requestSent:
              "கோரிக்கை அனுப்பப்பட்டது. கீழே பட்டியலில் விண்ணப்பம் இருந்தால் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. இல்லையெனில் மீண்டும் முயற்சிக்கவும்.",
            networkFail: "கோரிக்கையை சமர்ப்பிக்க முடியவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
            category: "உதவி வகை",
            select: "தேர்வு செய்யவும்",
            emergency: "அவசர கல்வி உதவி",
            equipment: "சாதனங்கள் மற்றும் வளங்கள்",
            boarding: "தங்குமிடம் மற்றும் அன்றாட தேவைகள்",
            tuition: "கட்டணம் மற்றும் பராமரிப்பு உதவி",
            amount: "மதிப்பிடப்பட்ட தொகை (SL LKR)",
            summary: "நிலை சுருக்கம்",
            summaryPlaceholder: "தேவையை விளக்கி ஆதார ஆவணங்களைப் பதிவேற்றவும்.",
            documents: "ஆதார ஆவணங்கள்",
            uploadAria: "ஆவணங்களைப் பதிவேற்றவும்",
            submitting: "சமர்ப்பிக்கப்படுகிறது...",
            submit: "விண்ணப்பத்தை சமர்ப்பிக்கவும்"
          }
        : {
            invalid: "Please complete the required fields and add a detailed description.",
            submitFailed: "Unable to submit your request. Please try again.",
            submitted: "Your application has been submitted for university verification.",
            requestSent:
              "Request sent. If you see your application in the list below, it was submitted successfully. Otherwise try again.",
            networkFail: "Unable to submit your request. Please check your connection and try again.",
            category: "Aid category",
            select: "Select",
            emergency: "Emergency academic aid",
            equipment: "Equipment & resources",
            boarding: "Boarding & necessities",
            tuition: "Tuition & maintenance",
            amount: "Estimated amount (SL LKR)",
            summary: "Situation summary",
            summaryPlaceholder: "Explain the need and upload supporting documents.",
            documents: "Supporting documents",
            uploadAria: "Upload documents",
            submitting: "Submitting...",
            submit: "Submit application"
          };

  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState("");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setAmount(v);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const values = {
      category: String(formData.get("category") ?? ""),
      amount: amount || String(formData.get("amount") ?? ""),
      description: String(formData.get("description") ?? "")
    };

    const result = aidRequestSchema.safeParse(values);
    if (!result.success) {
      setMessage(text.invalid);
      return;
    }

    setSubmitting(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch("/api/aid-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(result.data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const serverMessage = (body as { message?: string }).message;
        setMessage(serverMessage || text.submitFailed);
        return;
      }

      setMessage(text.submitted);
      event.currentTarget.reset();
      setAmount("");
      onSuccess?.();
      onShowSuccessPopup?.();
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === "AbortError";
      const isNetwork = err instanceof TypeError && err.message.includes("fetch");
      if (isAbort || isNetwork) {
        event.currentTarget.reset();
        setAmount("");
        onSuccess?.();
        onShowSuccessPopup?.();
        setMessage(text.requestSent);
      } else {
        setMessage(text.networkFail);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="category">
          {text.category}
        </label>
        <Select id="category" name="category" aria-required="true" required>
          <option value="">{text.select}</option>
          <option value="emergency">{text.emergency}</option>
          <option value="equipment">{text.equipment}</option>
          <option value="boarding">{text.boarding}</option>
          <option value="tuition">{text.tuition}</option>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="amount">
          {text.amount}
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={handleAmountChange}
            required
            aria-required="true"
            className="flex-1"
          />
          <span className="shrink-0 text-sm font-medium text-slate-500 dark:text-slate-400">SL LKR</span>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="description">
          {text.summary}
        </label>
        <TextArea
          id="description"
          name="description"
          rows={4}
          required
          aria-required="true"
          placeholder={text.summaryPlaceholder}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="document">
          {text.documents}
        </label>
        <Input id="document" name="document" type="file" aria-label={text.uploadAria} />
      </div>
      {message ? <p className="text-sm text-secondary">{message}</p> : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? text.submitting : text.submit}
      </Button>
    </form>
  );
}
