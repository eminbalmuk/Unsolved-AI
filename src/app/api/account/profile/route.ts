import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCurrentUser,
  isDatabaseConfigured,
  updateSupabaseProfile,
} from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  company: z.string().trim().max(100).optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const parsed = profileSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a valid name and company." },
      { status: 400 },
    );
  }

  const { name, company } = parsed.data;
  const normalizedCompany = company || null;

  try {
    if (isDatabaseConfigured()) {
      await getPrisma().user.update({
        where: { id: user.id },
        data: {
          name,
          company: normalizedCompany,
        },
      });
    }

    await updateSupabaseProfile({ name, company: normalizedCompany }).catch(() => {
      // Local profile updates should still succeed when Supabase Auth is not in use.
    });

    return NextResponse.json({
      user: {
        ...user,
        name,
        company: normalizedCompany,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Profile could not be updated.",
      },
      { status: 500 },
    );
  }
}
