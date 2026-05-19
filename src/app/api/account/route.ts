import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  clearSessionCookie,
  deleteSupabaseAuthUser,
  getCurrentUser,
  isDatabaseConfigured,
} from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128),
  confirmation: z.literal("DELETE"),
});

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const parsed = deleteAccountSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Type DELETE and enter your password to delete the account." },
      { status: 400 },
    );
  }

  const { password } = parsed.data;

  try {
    if (isDatabaseConfigured()) {
      const dbUser = await getPrisma().user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      });

      if (dbUser && dbUser.passwordHash !== "supabase-auth") {
        const passwordMatches = await bcrypt.compare(password, dbUser.passwordHash);

        if (!passwordMatches) {
          return NextResponse.json(
            { error: "Password is incorrect." },
            { status: 401 },
          );
        }

        await getPrisma().user.delete({ where: { id: user.id } });
        await clearSessionCookie();

        return NextResponse.json({ ok: true });
      }
    }

    await deleteSupabaseAuthUser({ user, password });

    if (isDatabaseConfigured()) {
      await getPrisma().user.delete({ where: { id: user.id } }).catch(() => {
        // The Supabase Auth user may not have a mirrored Prisma record.
      });
    }

    await clearSessionCookie();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Account could not be deleted.",
      },
      { status: 400 },
    );
  }
}
