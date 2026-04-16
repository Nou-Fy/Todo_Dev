import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/models/server/dbUser";
import { getTodoLimitForRole } from "@/models/server/userPlan";
import {
  countActiveTodosForUser,
  createTodoForUser,
  findActiveTodosForUser,
  findTodoByIdForUser,
  softDeleteTodoForUser,
  TodoUpdatePayload,
  updateTodoForUser,
} from "@/models/prisma/todoRepository";

type PrismaErrorWithCode = {
  code?: string;
};

function isDatabaseUnavailable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as PrismaErrorWithCode).code === "P1001"
  );
}

function internalErrorMessage(action: string, error: unknown) {
  if (isDatabaseUnavailable(error)) {
    return NextResponse.json(
      { error: "Base de donnees indisponible. Verifie que PostgreSQL est demarre." },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: action }, { status: 500 });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function handleGetTodos() {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return unauthorized();
    }

    const todos = await findActiveTodosForUser(user.id);
    return NextResponse.json(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    return internalErrorMessage("Failed to fetch todos", error);
  }
}

export async function handlePostTodo(request: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return unauthorized();
    }

    const limit = getTodoLimitForRole(user.role);
    if (limit != null) {
      const used = await countActiveTodosForUser(user.id);
      if (used >= limit) {
        return NextResponse.json(
          {
            error: `Quota atteint (${used}/${limit}). Passe en CAT2/CAT3 pour plus.`,
          },
          { status: 403 },
        );
      }
    }

    const { content } = (await request.json()) as { content?: unknown };

    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const todo = await createTodoForUser(user.id, content.trim());
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("Error creating todo:", error);
    return internalErrorMessage("Failed to create todo", error);
  }
}

export async function handleDeleteTodo(request: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = (await request.json()) as { id?: unknown };
    if (typeof id !== "number") {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const deleted = await softDeleteTodoForUser(id, user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json(deleted);
  } catch (error) {
    console.error("Error deleting todo:", error);
    return internalErrorMessage("Erreur suppression", error);
  }
}

export async function handlePatchTodo(request: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return unauthorized();
    }

    const body = (await request.json()) as {
      id?: unknown;
      content?: unknown;
      status?: unknown;
    };

    if (typeof body.id !== "number") {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const existing = await findTodoByIdForUser(body.id, user.id);
    if (!existing || existing.deleted) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    if (existing.status && typeof body.content === "string") {
      return NextResponse.json(
        { error: "Todo terminé: modification interdite" },
        { status: 400 },
      );
    }

    const updatePayload: TodoUpdatePayload = {};

    if (typeof body.content === "string") {
      const trimmed = body.content.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Content is required" }, { status: 400 });
      }
      updatePayload.content = trimmed;
    }

    if (typeof body.status === "boolean") {
      updatePayload.status = body.status;
      if (body.status && !existing.status) {
        updatePayload.completedAt = new Date();
      }
      if (!body.status && existing.status) {
        updatePayload.completedAt = null;
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await updateTodoForUser(body.id, user.id, updatePayload);
    if (!updated) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating todo:", error);
    return internalErrorMessage("Failed to update todo", error);
  }
}
