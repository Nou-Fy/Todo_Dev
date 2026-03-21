"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTodoStore, type Todo } from "@/controllers/todoStateController";

export type TodoPageController = {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  content: string;
  editingId: number | null;
  editingValue: string;
  showDone: boolean;
  toggleShowDone: () => void;
  setContent: (value: string) => void;
  updateEditingValue: (value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  startEdit: (id: number, initial: string) => void;
  cancelEdit: () => void;
  saveEdit: (id: number) => Promise<void>;
  toggleTodo: (id: number) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
};

export function useTodoPageController(): TodoPageController {
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [showDone, setShowDone] = useState(false);
  const hasFetchedRef = useRef(false);

  const { isLoaded, isSignedIn } = useAuth();

  const todos = useTodoStore((state) => state.todos);
  const loading = useTodoStore((state) => state.loading);
  const error = useTodoStore((state) => state.error);
  const fetchTodos = useTodoStore((state) => state.fetchTodos);
  const addTodo = useTodoStore((state) => state.addTodo);
  const updateTodo = useTodoStore((state) => state.updateTodo);
  const deleteTodo = useTodoStore((state) => state.deleteTodo);
  const toggleTodo = useTodoStore((state) => state.toggleTodo);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    void fetchTodos();
  }, [fetchTodos, isLoaded, isSignedIn]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    await addTodo(trimmed);
    setContent("");
  };

  const startEdit = (id: number, initial: string) => {
    setEditingId(id);
    setEditingValue(initial);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const saveEdit = async (id: number) => {
    const trimmed = editingValue.trim();
    if (!trimmed) return;

    await updateTodo(id, { content: trimmed });
    cancelEdit();
  };

  return {
    todos,
    loading,
    error,
    isLoaded,
    isSignedIn,
    content,
    setContent,
    editingId,
    editingValue,
    showDone,
    toggleShowDone: () => setShowDone((value) => !value),
    updateEditingValue: (value) => setEditingValue(value),
    handleSubmit,
    startEdit,
    cancelEdit,
    saveEdit,
    toggleTodo,
    deleteTodo,
  };
}
