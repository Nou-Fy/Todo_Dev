"use client";

import { TodoDashboardView } from "@/views/todo/TodoDashboardView";
import { useTodoPageController } from "@/controllers/useTodoPageController";

export default function PageTodo() {
  const controller = useTodoPageController();
  return <TodoDashboardView controller={controller} />;
}
