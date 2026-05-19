import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n-server";

export default async function NotFound() {
  const dictionary = await getDictionary();

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <p className="text-sm text-muted-foreground">404</p>
        <h1 className="mt-3 text-3xl font-semibold">
          {dictionary.common.notFoundTitle}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {dictionary.common.notFoundDescription}
        </p>
        <Button asChild className="mt-6">
          <Link href="/">{dictionary.common.notFoundAction}</Link>
        </Button>
      </div>
    </main>
  );
}
