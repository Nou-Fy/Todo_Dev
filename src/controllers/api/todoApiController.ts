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
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 });
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
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
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
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
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
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}
