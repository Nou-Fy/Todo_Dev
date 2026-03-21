import { create } from "zustand";
import {
  createTodoViaApi,
  loadTodosFromApi,
  softDeleteTodoViaApi,
  TodoDto,
  updateTodoViaApi,
} from "@/models/api/todoApiModel";

export type Todo = TodoDto;

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
      const data = await loadTodosFromApi();
      set({ todos: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      set({ loading: false });
    }
  },

  addTodo: async (content: string) => {
    try {
      const newTodo = await createTodoViaApi(content);
      set((state) => ({ todos: [newTodo, ...state.todos] }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  },

  deleteTodo: async (id: number) => {
    try {
      const deleted = await softDeleteTodoViaApi(id);
      if (deleted) {
        set((state) => ({ todos: state.todos.filter((todo) => todo.id !== id) }));
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  },

  updateTodo: async (id: number, update: TodoUpdate) => {
    try {
      set({ error: null });

      const updated = await updateTodoViaApi(id, update);
      if (!updated) {
        return;
      }
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
