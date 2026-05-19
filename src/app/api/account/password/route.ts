import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  changeSupabasePassword,
  getCurrentUser,
  isDatabaseConfigured,
} from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const parsed = passwordSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the passwords." },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    if (isDatabaseConfigured()) {
      const dbUser = await getPrisma().user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      });

      if (dbUser && dbUser.passwordHash !== "supabase-auth") {
        const passwordMatches = await bcrypt.compare(
          currentPassword,
          dbUser.passwordHash,
        );

        if (!passwordMatches) {
          return NextResponse.json(
            { error: "Current password is incorrect." },
            { status: 401 },
          );
        }

        await getPrisma().user.update({
          where: { id: user.id },
          data: { passwordHash: await bcrypt.hash(newPassword, 12) },
        });

        return NextResponse.json({ ok: true });
      }
    }

    await changeSupabasePassword({ user, currentPassword, newPassword });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Password could not be changed.",
      },
      { status: 400 },
    );
  }
}
