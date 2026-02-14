"use client";

import { useState } from "react";
import { aidRequestSchema } from "@/lib/validation";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { Select } from "@/components/shared/select";
import { TextArea } from "@/components/shared/text-area";

export function AidRequestForm() {
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const values = {
      category: String(formData.get("category") ?? ""),
      amount: String(formData.get("amount") ?? ""),
      description: String(formData.get("description") ?? "")
    };

    const result = aidRequestSchema.safeParse(values);
    if (!result.success) {
      setMessage("Please complete the required fields and add a detailed description.");
      return;
    }

    try {
      const response = await fetch("/api/aid-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(result.data)
      });

      if (!response.ok) {
        setMessage("Unable to submit your request. Please try again.");
        return;
      }

      setMessage("Your application has been submitted for university verification.");
      event.currentTarget.reset();
    } catch {
      setMessage("Unable to submit your request. Please check your connection and try again.");
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
          Estimated amount (LKR)
        </label>
        <Input id="amount" name="amount" type="text" required aria-required="true" />
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
      <Button type="submit">Submit application</Button>
    </form>
  );
}
