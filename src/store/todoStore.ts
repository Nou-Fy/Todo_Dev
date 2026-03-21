import { create } from "zustand";

export type Todo = {
  id: number;
  content: string;
  status: boolean;
  createdAt: string; // ISO string returned by the API
  completedAt: string | null; // ISO string when completed, else null
};

async function getApiErrorMessage(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: unknown };
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // ignore JSON parsing errors
  }
  return fallback;
}

type TodoUpdate = Partial<Pick<Todo, "content" | "status">>;

type TodoState = {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  fetchTodos: () => Promise<void>;
  addTodo: (content: string) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  updateTodo: (id: number, update: TodoUpdate) => Promise<void>;
  toggleTodo: (id: number) => Promise<void>;
};

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  loading: false,
  error: null,

  fetchTodos: async () => {
    set({ loading: true, error: null });

    try {
      const response = await fetch("/api/todos");
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(
            response,
            "Erreur lors de la récupération des todos",
          ),
        );
      }
      const data: Todo[] = await response.json();
      set({ todos: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      set({ loading: false });
    }
  },

  addTodo: async (content: string) => {
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, "Erreur lors de la création du todo"),
        );
      }

      const newTodo: Todo = await response.json();
      set((state) => ({ todos: [newTodo, ...state.todos] }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  },

  deleteTodo: async (id: number) => {
    try {
      const response = await fetch("/api/todos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(
            response,
            "Erreur lors de la suppression du todo",
          ),
        );
      }

      set((state) => ({ todos: state.todos.filter((todo) => todo.id !== id) }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  },

  updateTodo: async (id: number, update: TodoUpdate) => {
    try {
      set({ error: null });

      const response = await fetch("/api/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...update }),
      });

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(
            response,
            "Erreur lors de la mise à jour du todo",
          ),
        );
      }

      const updated: Todo = await response.json();
      set((state) => ({
        todos: state.todos.map((todo) => (todo.id === id ? updated : todo)),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  },

  toggleTodo: async (id: number) => {
    const current = get().todos.find((todo) => todo.id === id);
    if (!current) return;

    await get().updateTodo(id, { status: !current.status });
  },
}));
