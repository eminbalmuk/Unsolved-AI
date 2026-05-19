"use client";

import { type FormEvent, useState, useTransition } from "react";
import { ShieldCheck, Trash2, UserRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import type { SessionUser } from "@/lib/auth";

type Message = {
  type: "success" | "error";
  text: string;
};

async function readApiMessage(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  if (!response.ok) {
    throw new Error(data?.error ?? fallback);
  }
}

export function AccountSettingsPanel({ user }: { user: SessionUser }) {
  const [profileMessage, setProfileMessage] = useState<Message | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<Message | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<Message | null>(null);
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setProfileMessage(null);
    startProfileTransition(async () => {
      try {
        const response = await fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: String(formData.get("name") ?? ""),
            company: String(formData.get("company") ?? ""),
          }),
        });

        await readApiMessage(response, "Profile could not be updated.");
        setProfileMessage({ type: "success", text: "Profile updated." });
      } catch (error) {
        setProfileMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Profile could not be updated.",
        });
      }
    });
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setPasswordMessage(null);
    startPasswordTransition(async () => {
      try {
        const response = await fetch("/api/account/password", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: String(formData.get("currentPassword") ?? ""),
            newPassword: String(formData.get("newPassword") ?? ""),
            confirmPassword: String(formData.get("confirmPassword") ?? ""),
          }),
        });

        await readApiMessage(response, "Password could not be changed.");
        form.reset();
        setPasswordMessage({ type: "success", text: "Password changed." });
      } catch (error) {
        setPasswordMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Password could not be changed.",
        });
      }
    });
  }

  function handleDeleteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setDeleteMessage(null);
    startDeleteTransition(async () => {
      try {
        const response = await fetch("/api/account", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: String(formData.get("deletePassword") ?? ""),
            confirmation: String(formData.get("confirmation") ?? ""),
          }),
        });

        await readApiMessage(response, "Account could not be deleted.");
        window.location.href = "/";
      } catch (error) {
        setDeleteMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Account could not be deleted.",
        });
      }
    });
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card className="bg-card/82">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-5 text-primary" aria-hidden />
            Account profile
          </CardTitle>
          <CardDescription>
            Update the identity shown across your founder workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleProfileSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="account-name">Name</Label>
              <Input
                id="account-name"
                name="name"
                defaultValue={user.name ?? ""}
                required
                minLength={2}
                maxLength={80}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-company">Company</Label>
              <Input
                id="account-company"
                name="company"
                defaultValue={user.company ?? ""}
                maxLength={100}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-email">Email</Label>
              <Input id="account-email" value={user.email} readOnly disabled />
            </div>
            {profileMessage ? (
              <Alert variant={profileMessage.type === "error" ? "destructive" : "default"}>
                <AlertDescription>{profileMessage.text}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" size="lg" disabled={isProfilePending}>
              {isProfilePending ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card/82">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" aria-hidden />
            Password
          </CardTitle>
          <CardDescription>
            Change your password without leaving the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handlePasswordSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            {passwordMessage ? (
              <Alert variant={passwordMessage.type === "error" ? "destructive" : "default"}>
                <AlertDescription>{passwordMessage.text}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" size="lg" disabled={isPasswordPending}>
              {isPasswordPending ? "Changing..." : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30 bg-destructive/5 xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" aria-hidden />
            Delete account
          </CardTitle>
          <CardDescription>
            This removes your account and related saved workspace data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleDeleteSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="delete-confirmation">Type DELETE</Label>
              <Input
                id="delete-confirmation"
                name="confirmation"
                pattern="DELETE"
                placeholder="DELETE"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="delete-password">Password</Label>
              <Input
                id="delete-password"
                name="deletePassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                variant="destructive"
                size="lg"
                disabled={isDeletePending}
                className="w-full"
              >
                {isDeletePending ? "Deleting..." : "Delete"}
              </Button>
            </div>
            {deleteMessage ? (
              <Alert
                variant={deleteMessage.type === "error" ? "destructive" : "default"}
                className="md:col-span-3"
              >
                <AlertDescription>{deleteMessage.text}</AlertDescription>
              </Alert>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
