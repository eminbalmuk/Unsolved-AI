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
import type { Dictionary } from "@/lib/i18n";

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

export function AccountSettingsPanel({
  user,
  dictionary,
}: {
  user: SessionUser;
  dictionary: Dictionary["account"];
}) {
  const [profileMessage, setProfileMessage] = useState<Message | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<Message | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<Message | null>(null);
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const prefersLocalErrors = dictionary.email === "E-posta";

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

        await readApiMessage(response, dictionary.profileError);
        setProfileMessage({ type: "success", text: dictionary.profileUpdated });
      } catch (error) {
        setProfileMessage({
          type: "error",
          text:
            error instanceof Error && !prefersLocalErrors
              ? error.message
              : dictionary.profileError,
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

        await readApiMessage(response, dictionary.passwordError);
        form.reset();
        setPasswordMessage({ type: "success", text: dictionary.passwordChanged });
      } catch (error) {
        setPasswordMessage({
          type: "error",
          text:
            error instanceof Error && !prefersLocalErrors
              ? error.message
              : dictionary.passwordError,
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

        await readApiMessage(response, dictionary.deleteError);
        window.location.href = "/";
      } catch (error) {
        setDeleteMessage({
          type: "error",
          text:
            error instanceof Error && !prefersLocalErrors
              ? error.message
              : dictionary.deleteError,
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
            {dictionary.profileTitle}
          </CardTitle>
          <CardDescription>
            {dictionary.profileDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleProfileSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="account-name">{dictionary.name}</Label>
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
              <Label htmlFor="account-company">{dictionary.company}</Label>
              <Input
                id="account-company"
                name="company"
                defaultValue={user.company ?? ""}
                maxLength={100}
                placeholder={dictionary.optional}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-email">{dictionary.email}</Label>
              <Input id="account-email" value={user.email} readOnly disabled />
            </div>
            {profileMessage ? (
              <Alert variant={profileMessage.type === "error" ? "destructive" : "default"}>
                <AlertDescription>{profileMessage.text}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" size="lg" disabled={isProfilePending}>
              {isProfilePending ? dictionary.saving : dictionary.saveProfile}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card/82">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" aria-hidden />
            {dictionary.passwordTitle}
          </CardTitle>
          <CardDescription>
            {dictionary.passwordDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handlePasswordSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="current-password">{dictionary.currentPassword}</Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">{dictionary.newPassword}</Label>
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
              <Label htmlFor="confirm-password">{dictionary.confirmPassword}</Label>
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
              {isPasswordPending ? dictionary.changing : dictionary.changePassword}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30 bg-destructive/5 xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" aria-hidden />
            {dictionary.deleteTitle}
          </CardTitle>
          <CardDescription>
            {dictionary.deleteDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleDeleteSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="delete-confirmation">{dictionary.typeDelete}</Label>
              <Input
                id="delete-confirmation"
                name="confirmation"
                pattern="DELETE"
                placeholder="DELETE"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="delete-password">{dictionary.passwordTitle}</Label>
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
                {isDeletePending ? dictionary.deleting : dictionary.delete}
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
