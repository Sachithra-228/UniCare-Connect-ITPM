"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { loginSchema } from "@/lib/validation";

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const data = new FormData(event.currentTarget);
    const values = {
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? "")
    };

    const result = loginSchema.safeParse(values);
    if (!result.success) {
      setFormError("Please provide a valid email and password.");
      return;
    }

    try {
      await signInWithEmail(result.data.email, result.data.password);
    } catch (error) {
      setFormError("Unable to sign in. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Welcome back</h1>
        <p className="text-sm text-slate-500">Sign in to access UniCare Connect.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
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
        <Button type="submit">Sign in</Button>
        <Button type="button" variant="secondary" onClick={signInWithGoogle}>
          Sign in with Google
        </Button>
      </form>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <Link href="/forgot-password">Forgot password?</Link>
        <Link href="/register">Create account</Link>
      </div>
    </div>
  );
}
