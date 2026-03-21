"use client";

import { useEffect, useState } from "react";
import { useTodoStore, type Todo } from "@/store/todoStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { Edit, Trash2 } from "lucide-react";

export default function PageTodo() {
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const { isLoaded, isSignedIn } = useAuth();

  const todos = useTodoStore((state) => state.todos);
  const loading = useTodoStore((state) => state.loading);
  const error = useTodoStore((state) => state.error);
  const fetchTodos = useTodoStore((state) => state.fetchTodos);
  const addTodo = useTodoStore((state) => state.addTodo);
  const deleteTodo = useTodoStore((state) => state.deleteTodo);
  const updateTodo = useTodoStore((state) => state.updateTodo);
  const toggleTodo = useTodoStore((state) => state.toggleTodo);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return;
    fetchTodos();
  }, [fetchTodos, isLoaded, isSignedIn]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = content.trim();
    if (!trimmed) return;

    await addTodo(trimmed);
    setContent("");
  }

  function startEdit(id: number, initial: string) {
    setEditingId(id);
    setEditingValue(initial);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingValue("");
  }

  async function saveEdit(id: number) {
    const trimmed = editingValue.trim();
    if (!trimmed) return;

    await updateTodo(id, { content: trimmed });
    cancelEdit();
  }

  function renderTodo(todo: Todo) {
    const created = new Date(todo.createdAt);
    const createdOk = !Number.isNaN(created.getTime());
    const deadline = createdOk
      ? new Date(created.getTime() + 24 * 60 * 60 * 1000)
      : null;

    const completed = todo.completedAt ? new Date(todo.completedAt) : null;
    const completedOk =
      completed != null && !Number.isNaN(completed.getTime());

    const isOverdue = deadline ? now > deadline.getTime() : false;
    const finishedOnTime =
      todo.status && completedOk && deadline
        ? completed.getTime() <= deadline.getTime()
        : false;
    const finishedLate =
      todo.status && completedOk && deadline
        ? completed.getTime() > deadline.getTime()
        : false;

    const formatDateTime = (d: Date) =>
      d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

    return (
      <div
        key={todo.id}
        className="flex items-start justify-between gap-3 rounded-xl border bg-card/75 p-4 shadow-sm backdrop-blur hover:border-primary">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={todo.status}
            onChange={() => {
              if (editingId === todo.id) cancelEdit();
              void toggleTodo(todo.id);
            }}
            className="mt-1 h-5 w-5 rounded border-border text-primary focus-visible:ring-ring"
          />
          <div className="flex-1">
            {editingId === todo.id && !todo.status ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                />
                <Button size="sm" onClick={() => void saveEdit(todo.id)}>
                  Enregistrer
                </Button>
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  Annuler
                </Button>
              </div>
            ) : (
              <p
                className={
                  "text-sm " +
                  (todo.status ? "line-through text-muted-foreground" : "")
                }>
                {todo.content}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                Créé le : {createdOk ? formatDateTime(created) : "—"}
              </span>

              {todo.status ? (
                <span
                  className={
                    "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium " +
                    (finishedOnTime
                      ? "border-accent/40 bg-accent/70 text-accent-foreground"
                      : finishedLate
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-border bg-muted text-muted-foreground")
                  }>
                  Fait le :{" "}
                  {completedOk && completed ? formatDateTime(completed) : "—"}
                  {completedOk && deadline ? " (vs +24h)" : ""}
                </span>
              ) : (
                <span
                  className={
                    "inline-flex items-center rounded-md border px-2 py-1 text-xs " +
                    (isOverdue
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-border bg-muted text-muted-foreground")
                  }>
                  Deadline : {deadline ? formatDateTime(deadline) : "—"} (+24h)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editingId !== todo.id && !todo.status && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => startEdit(todo.id, todo.content)}>
              Modifier <Edit />
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={() => void deleteTodo(todo.id)}>
            <Trash2 />
          </Button>
        </div>
      </div>
    );
  }

  const activeTodos = todos.filter((todo) => !todo.status);
  const doneTodos = todos.filter((todo) => todo.status);

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Todo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connecte-toi pour voir et créer tes tâches.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <SignInButton mode="modal">
            <Button>Se connecter</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="outline">S&apos;inscrire</Button>
          </SignUpButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Todo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ajoute une tâche, puis coche-la pour marquer comme terminée.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="todo-content">Nouvelle tâche</Label>
          <Input
            id="todo-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écris ta tâche ici..."
          />
        </div>

        <Button type="submit" disabled={!content.trim()}>
          Ajouter
        </Button>
      </form>

      {loading && <p className="mt-4 text-muted-foreground">Chargement...</p>}
      {error && <p className="mt-4 text-destructive">Erreur : {error}</p>}

      <div className="mt-10 space-y-3">
        {activeTodos.length === 0 ? (
          <p className="text-muted-foreground">
            Aucun todo en cours{doneTodos.length > 0 ? "." : " trouvé."}
          </p>
        ) : (
          activeTodos.map(renderTodo)
        )}
      </div>

      {doneTodos.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Tâches terminées</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDone((v) => !v)}>
              {showDone ? "Masquer" : "Afficher"} ({doneTodos.length})
            </Button>
          </div>

          {showDone && (
            <div className="mt-3 space-y-3">{doneTodos.map(renderTodo)}</div>
          )}
        </div>
      )}
    </div>
  );
}
