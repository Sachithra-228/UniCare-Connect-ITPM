"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { registerSchema } from "@/lib/validation";

export default function RegisterPage() {
  const { registerWithEmail } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccess(false);

    const data = new FormData(event.currentTarget);
    const values = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? "")
    };

    const result = registerSchema.safeParse(values);
    if (!result.success) {
      setFormError("Please complete all required fields.");
      return;
    }

    try {
      await registerWithEmail(result.data.email, result.data.password);
      setSuccess(true);
    } catch (error) {
      setFormError("Unable to create account. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Create your account</h1>
        <p className="text-sm text-slate-500">
          Register to access financial, career, and wellness support.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="name">
            Full name
          </label>
          <Input id="name" name="name" type="text" required aria-required="true" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input id="email" name="email" type="email" required aria-required="true" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input id="password" name="password" type="password" required aria-required="true" />
        </div>
        {formError ? <p className="text-sm text-red-500">{formError}</p> : null}
        {success ? (
          <p className="text-sm text-secondary">
            Verification email sent. Please check your inbox.
          </p>
        ) : null}
        <Button type="submit">Create account</Button>
      </form>
      <div className="text-sm text-slate-500">
        Already have an account? <Link href="/login">Sign in</Link>
      </div>
    </div>
  );
}
