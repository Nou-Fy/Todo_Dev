import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/server/dbUser";
import { getTodoLimitForRole } from "@/lib/server/userPlan";
import type { Todo as PrismaTodo } from "@prisma/client";

function serializeTodo(todo: PrismaTodo) {
  const createdAt =
    todo.createdAt instanceof Date
      ? todo.createdAt.toISOString()
      : (() => {
          const raw = String(todo.createdAt);
          const parsed = new Date(raw);
          return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString();
        })();

  const completedAt =
    todo.completedAt == null
      ? null
      : todo.completedAt instanceof Date
        ? todo.completedAt.toISOString()
        : (() => {
            const raw = String(todo.completedAt);
            const parsed = new Date(raw);
            return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString();
          })();

  return { ...todo, createdAt, completedAt };
}

export async function GET() {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todos = await prisma.todo.findMany({
      where: { deleted: false, userId: user.id },
      orderBy: { id: "desc" },
    });
    return NextResponse.json(todos.map(serializeTodo));
  } catch (error) {
    console.error("Error fetching todos:", error);
    return NextResponse.json(
      { error: "Failed to fetch todos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = getTodoLimitForRole(user.role);
    if (limit != null) {
      const used = await prisma.todo.count({
        where: { deleted: false, userId: user.id },
      });
      if (used >= limit) {
        return NextResponse.json(
          {
            error: `Quota atteint (${used}/${limit}). Passe en CAT2/CAT3 pour plus.`,
          },
          { status: 403 },
        );
      }
    }

    const { content } = (await request.json()) as { content: string };

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    const todo = await prisma.todo.create({
      data: {
        content,
        status: false,
        userId: user.id,
      },
    });

    return NextResponse.json(serializeTodo(todo), { status: 201 });
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json(
      { error: "Failed to create todo" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = (await request.json()) as { id: number };

    if (typeof id !== "number") {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const result = await prisma.todo.updateMany({
      where: { id, userId: user.id },
      data: { deleted: true },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    const removed = await prisma.todo.findUnique({ where: { id } });
    return NextResponse.json(removed ? serializeTodo(removed) : null);
  } catch (error) {
    console.error("Error deleting todo:", error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      id: number;
      content?: string;
      status?: boolean;
    };

    if (typeof body.id !== "number") {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const existing = await prisma.todo.findFirst({
      where: { id: body.id, userId: user.id },
      select: { deleted: true, status: true },
    });

    if (!existing || existing.deleted) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    // Business rule: once a todo is marked as done, content can't be edited.
    if (existing.status && typeof body.content === "string") {
      return NextResponse.json(
        { error: "Todo terminé: modification interdite" },
        { status: 400 },
      );
    }

    const data: {
      content?: string;
      status?: boolean;
      completedAt?: Date | null;
    } = {};

    if (typeof body.content === "string") {
      const trimmed = body.content.trim();
      if (!trimmed) {
        return NextResponse.json(
          { error: "Content is required" },
          { status: 400 },
        );
      }
      data.content = trimmed;
    }

    if (typeof body.status === "boolean") {
      data.status = body.status;

      // Only set completedAt on transitions.
      if (body.status === true && existing.status === false) {
        data.completedAt = new Date();
      }
      if (body.status === false && existing.status === true) {
        data.completedAt = null;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const result = await prisma.todo.updateMany({
      where: { id: body.id, userId: user.id, deleted: false },
      data,
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    const updated = await prisma.todo.findUnique({ where: { id: body.id } });
    return NextResponse.json(updated ? serializeTodo(updated) : null);
  } catch (error) {
    console.error("Error updating todo:", error);
    return NextResponse.json(
      { error: "Failed to update todo" },
      { status: 500 },
    );
  }
}
