"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    if (!email) {
      setMessage("Please enter a valid email.");
      return;
    }

    try {
      await requestPasswordReset(email);
      setMessage("Password reset link sent to your email.");
    } catch {
      setMessage("Unable to send reset link right now. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Reset your password</h1>
        <p className="text-sm text-slate-500">We will send a reset link to your email.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input id="email" name="email" type="email" required aria-required="true" />
        </div>
        {message ? <p className="text-sm text-secondary">{message}</p> : null}
        <Button type="submit">Send reset link</Button>
      </form>
    </div>
  );
}
