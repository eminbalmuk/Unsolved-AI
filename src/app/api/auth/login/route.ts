import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  isSupabaseAuthConfigured,
  setSessionCookie,
  signInWithSupabase,
} from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) {
    if (isSupabaseAuthConfigured()) {
      const parsed = loginSchema.safeParse(await request.json());

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Please provide a valid email and password." },
          { status: 400 },
        );
      }

      try {
        const user = await signInWithSupabase(parsed.data);
        return NextResponse.json({ user });
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Supabase login failed.",
          },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Auth is not configured. Add Supabase Auth env vars or DATABASE_URL plus AUTH_SECRET.",
      },
      { status: 503 },
    );
  }

  const parsed = loginSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a valid email and password." },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  const user = await getPrisma().user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      company: true,
      emailService: true,
      role: true,
      plan: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Email or password is incorrect." },
      { status: 401 },
    );
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return NextResponse.json(
      { error: "Email or password is incorrect." },
      { status: 401 },
    );
  }

  await setSessionCookie(user.id);

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    company: user.company,
    emailService: user.emailService,
    role: user.role,
    plan: user.plan,
  };

  return NextResponse.json({ user: safeUser });
}
