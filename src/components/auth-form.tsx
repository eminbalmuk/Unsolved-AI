"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n";

type AuthMode = "login" | "register";

export function AuthForm({
  mode,
  dictionary,
}: {
  mode: AuthMode;
  dictionary: Dictionary["auth"];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isRegister = mode === "register";
  const prefersLocalErrors = dictionary.email === "E-posta";

  function submit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const payload = {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        company: String(formData.get("company") ?? ""),
      };

      const response = await fetch(
        isRegister ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(
          prefersLocalErrors
            ? dictionary.authFailed
            : result.error ?? dictionary.authFailed,
        );
        return;
      }

      router.push("/explora");
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-md bg-card/82 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-3xl">
          {isRegister ? dictionary.registerTitle : dictionary.loginTitle}
        </CardTitle>
        <CardDescription className="text-base">
          {isRegister
            ? dictionary.registerDescription
            : dictionary.loginDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={submit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>{dictionary.authUnavailable}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {isRegister ? (
            <div className="space-y-2">
              <Label htmlFor="name">{dictionary.name}</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  className="h-12 pl-10 text-base"
                  placeholder="Muhammet Emin"
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">{dictionary.email}</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="h-12 pl-10 text-base"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{dictionary.password}</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={isRegister ? 8 : 1}
                className="h-12 pl-10 text-base"
                placeholder={
                  isRegister
                    ? dictionary.passwordRegisterPlaceholder
                    : dictionary.passwordLoginPlaceholder
                }
              />
            </div>
          </div>

          {isRegister ? (
            <div className="space-y-2">
              <Label htmlFor="company">{dictionary.company}</Label>
              <Input
                id="company"
                name="company"
                className="h-12 text-base"
                placeholder={dictionary.companyPlaceholder}
              />
            </div>
          ) : null}

          <Button disabled={isPending} className="h-12 w-full text-base">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {isRegister ? dictionary.createAccount : dictionary.signIn}
          </Button>
        </form>

        <p className="mt-6 text-center text-base text-muted-foreground">
          {isRegister ? dictionary.alreadyHaveAccount : dictionary.noAccountYet}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-medium text-primary hover:underline"
          >
            {isRegister ? dictionary.signIn : dictionary.createOne}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
