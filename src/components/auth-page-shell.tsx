import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { BrandLogo } from "@/components/brand-logo";
import { getDictionary } from "@/lib/i18n-server";

export async function AuthPageShell({ mode }: { mode: "login" | "register" }) {
  const dictionary = await getDictionary();

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-background text-foreground lg:grid-cols-[0.9fr_1.1fr]">
      <div className="absolute inset-0 -z-10 dashboard-grid opacity-30" />
      <section className="relative hidden border-r lg:block">
        <Image
          src="/images/secure-workspace-visual.webp"
          alt="Problem radar background"
          fill
          priority
          className="object-cover opacity-70"
          sizes="45vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_oklch,var(--background)_74%,transparent)_62%,transparent_100%)]" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link href="/" className="flex items-center gap-4">
            <BrandLogo />
            <span>
              <span className="block text-lg font-semibold">Unsolved</span>
              <span className="block text-base text-muted-foreground">
                {dictionary.common.brandTagline}
              </span>
            </span>
          </Link>

          <div className="max-w-xl space-y-5">
            <p className="text-lg font-medium text-primary">
              {dictionary.auth.sideEyebrow}
            </p>
            <h1 className="text-6xl font-semibold leading-tight">
              {dictionary.auth.sideTitle}
            </h1>
            <p className="text-xl leading-9 text-muted-foreground">
              {dictionary.auth.sideText}
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-4">
              <BrandLogo size={58} />
              <span className="text-lg font-semibold">Unsolved</span>
            </Link>
          </div>
          <AuthForm mode={mode} dictionary={dictionary.auth} />
        </div>
      </section>
    </main>
  );
}
