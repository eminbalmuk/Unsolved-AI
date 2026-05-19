import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  isSupabaseAuthConfigured,
  setSessionCookie,
  signUpWithSupabase,
} from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  company: z.string().trim().max(100).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) {
    if (isSupabaseAuthConfigured()) {
      const parsed = registerSchema.safeParse(await request.json());

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Please provide a valid name, email, and 8+ character password." },
          { status: 400 },
        );
      }

      try {
        const result = await signUpWithSupabase(parsed.data);
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Supabase registration failed.",
          },
          { status: 400 },
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

  const parsed = registerSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a valid name, email, and 8+ character password." },
      { status: 400 },
    );
  }

  const { name, email, password, company } = parsed.data;
  const prisma = getPrisma();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      company: company || null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      company: true,
      role: true,
      plan: true,
    },
  });

  await setSessionCookie(user.id);

  return NextResponse.json({ user }, { status: 201 });
}
