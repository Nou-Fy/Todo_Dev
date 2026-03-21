import "server-only";

import { UserRole } from "@prisma/client";

export const TODO_LIMIT_BY_ROLE: Record<UserRole, number | null> = {
  CAT1: 100,
  CAT2: 10_000,
  CAT3: null, // unlimited
};

export function getTodoLimitForRole(role: UserRole): number | null {
  return TODO_LIMIT_BY_ROLE[role] ?? TODO_LIMIT_BY_ROLE.CAT1;
}

