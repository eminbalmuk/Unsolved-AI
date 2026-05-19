import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";

export async function HeaderAuth({
  dictionary,
}: {
  dictionary: Dictionary["common"];
}) {
  const configured = isAuthConfigured();
  const user = await getCurrentUser();

  if (!configured) {
    return (
      <div className="hidden items-center gap-2 sm:flex">
        <Badge variant="outline" className="text-base">
          {dictionary.authSetupNeeded}
        </Badge>
        <Button size="sm" className="text-lg" asChild>
          <Link href="/login">{dictionary.signIn}</Link>
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="hidden items-center gap-2 sm:flex">
        <Button size="sm" variant="ghost" className="text-lg" asChild>
          <Link href="/login">{dictionary.signIn}</Link>
        </Button>
        <Button size="sm" className="text-lg" asChild>
          <Link href="/register">{dictionary.createAccount}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-3 sm:flex">
      <div className="flex items-center gap-2 rounded-md border bg-card/70 px-3 py-2">
        <UserRound className="size-4 text-primary" aria-hidden />
        <span className="max-w-44 truncate text-base">{user.email}</span>
        <Badge variant="secondary" className="text-xs">
          {user.plan.toLowerCase()}
        </Badge>
      </div>
      <form action="/api/auth/logout" method="post">
        <Button size="sm" variant="secondary" className="text-lg">
          <LogOut className="size-4" aria-hidden />
          {dictionary.signOut}
        </Button>
      </form>
    </div>
  );
}
