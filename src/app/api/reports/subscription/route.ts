import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureDatabaseUser,
  getCurrentUser,
  isDatabaseConfigured,
} from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

const subscriptionSchema = z.object({
  enabled: z.boolean(),
});

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is required to save email subscription settings." },
      { status: 503 },
    );
  }

  const parsed = subscriptionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a valid subscription setting." },
      { status: 400 },
    );
  }

  await ensureDatabaseUser(user);

  const updatedUser = await getPrisma().user.update({
    where: { id: user.id },
    data: {
      emailService: parsed.data.enabled ? "ENABLED" : "DISABLED",
    },
    select: {
      emailService: true,
    },
  });

  return NextResponse.json({
    emailService: updatedUser.emailService,
  });
}
