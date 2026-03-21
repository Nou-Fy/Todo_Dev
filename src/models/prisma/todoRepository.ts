import { prisma } from "@/models/server/prismaClient";
import type { Todo as PrismaTodo } from "@prisma/client";

export type SerializedTodo = {
  id: number;
  content: string;
  status: boolean;
  createdAt: string;
  completedAt: string | null;
  deleted: boolean;
  userId: number | null;
};

export type TodoUpdatePayload = Partial<
  Pick<PrismaTodo, "content" | "status" | "completedAt">
>;

type DateLike = Date | string | null | undefined;

function toIsoString(value: DateLike) {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function serializeTodo(todo: PrismaTodo): SerializedTodo {
  return {
    ...todo,
    createdAt: toIsoString(todo.createdAt) ?? String(todo.createdAt),
    completedAt: toIsoString(todo.completedAt),
  };
}

export async function findActiveTodosForUser(userId: number) {
  const todos = await prisma.todo.findMany({
    where: { deleted: false, userId },
    orderBy: { id: "desc" },
  });
  return todos.map(serializeTodo);
}

export async function countActiveTodosForUser(userId: number) {
  return prisma.todo.count({ where: { deleted: false, userId } });
}

export async function createTodoForUser(userId: number, content: string) {
  const todo = await prisma.todo.create({
    data: { content, status: false, userId },
  });
  return serializeTodo(todo);
}

export async function softDeleteTodoForUser(id: number, userId: number) {
  const result = await prisma.todo.updateMany({
    where: { id, userId },
    data: { deleted: true },
  });
  if (result.count === 0) {
    return null;
  }
  const removed = await prisma.todo.findUnique({ where: { id } });
  return removed ? serializeTodo(removed) : null;
}

export async function findTodoByIdForUser(id: number, userId: number) {
  const todo = await prisma.todo.findFirst({ where: { id, userId } });
  return todo ? serializeTodo(todo) : null;
}

export async function updateTodoForUser(
  id: number,
  userId: number,
  data: TodoUpdatePayload,
) {
  const result = await prisma.todo.updateMany({
    where: { id, userId, deleted: false },
    data,
  });
  if (result.count === 0) {
    return null;
  }
  const updated = await prisma.todo.findUnique({ where: { id } });
  return updated ? serializeTodo(updated) : null;
}
