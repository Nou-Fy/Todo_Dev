import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Returns the current DB user for the signed-in Clerk user.
 * On each call, we try to sync basic profile fields (email/name/avatar) from
 * Clerk. If Clerk can't be reached, we fall back to safe placeholders and keep
 * the existing DB row unchanged.
 */
export async function getCurrentDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const suffix = userId.slice(-8);
  const fallbackPseudo = `user-${suffix}`;
  const fallbackEmail = `${userId}@clerk.local`;

  let clerk = null as Awaited<ReturnType<typeof currentUser>>;
  try {
    clerk = await currentUser();
  } catch {
    clerk = null;
  }

  // If Clerk isn't reachable (or didn't return a user), don't overwrite any
  // existing profile fields with nullish placeholders.
  if (!clerk) {
    const existing = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (existing) return existing;

    try {
      return await prisma.user.create({
        data: {
          clerkUserId: userId,
          email: fallbackEmail,
          name: fallbackPseudo,
          pseudo: fallbackPseudo,
        },
      });
    } catch (err) {
      const again = await prisma.user.findUnique({
        where: { clerkUserId: userId },
      });
      if (again) return again;
      throw err;
    }
  }

  const primaryEmail =
    clerk.primaryEmailAddress?.emailAddress ??
    clerk.emailAddresses?.[0]?.emailAddress ??
    null;

  const email = primaryEmail ?? fallbackEmail;
  const firstName = clerk.firstName ?? null;
  const lastName = clerk.lastName ?? null;
  const imageUrl = clerk.imageUrl ?? null;

  const derivedName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    clerk.fullName?.trim() ||
    null;

  const pseudo =
    clerk.username?.trim() ||
    (primaryEmail ? primaryEmail.split("@")[0]?.trim() : "") ||
    fallbackPseudo;

  const name = derivedName ?? pseudo;

  try {
    return await prisma.user.upsert({
      where: { clerkUserId: userId },
      create: {
        clerkUserId: userId,
        email,
        name,
        pseudo,
        firstName,
        lastName,
        imageUrl,
      },
      update: {
        email,
        name,
        pseudo,
        firstName,
        lastName,
        imageUrl,
      },
    });
  } catch (err) {
    // If another row already exists with the same clerkUserId (race condition),
    // fetch it instead of failing.
    const again = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (again) return again;

    throw err;
  }
}
