"use client";

import { useState } from "react";
import { aidRequestSchema } from "@/lib/validation";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { Select } from "@/components/shared/select";
import { TextArea } from "@/components/shared/text-area";

type AidRequestFormProps = { onSuccess?: () => void; onShowSuccessPopup?: () => void };

const FETCH_TIMEOUT_MS = 60000;

export function AidRequestForm({ onSuccess, onShowSuccessPopup }: AidRequestFormProps) {
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
      setMessage("Please complete the required fields and add a detailed description.");
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
        setMessage(serverMessage || "Unable to submit your request. Please try again.");
        return;
      }

      setMessage("Your application has been submitted for university verification.");
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
        setMessage(
          "Request sent. If you see your application in the list below, it was submitted successfully. Otherwise try again."
        );
      } else {
        setMessage("Unable to submit your request. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="category">
          Aid category
        </label>
        <Select id="category" name="category" aria-required="true" required>
          <option value="">Select</option>
          <option value="emergency">Emergency academic aid</option>
          <option value="equipment">Equipment & resources</option>
          <option value="boarding">Boarding & necessities</option>
          <option value="tuition">Tuition & maintenance</option>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="amount">
          Estimated amount (SL LKR)
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
          Situation summary
        </label>
        <TextArea
          id="description"
          name="description"
          rows={4}
          required
          aria-required="true"
          placeholder="Explain the need and upload supporting documents."
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="document">
          Supporting documents
        </label>
        <Input id="document" name="document" type="file" aria-label="Upload documents" />
      </div>
      {message ? <p className="text-sm text-secondary">{message}</p> : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
