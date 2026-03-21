"use client";

import { useEffect, useState } from "react";
import { Button } from "@/views/ui/button";
import { Input } from "@/views/ui/input";
import { Label } from "@/views/ui/label";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { TodoCardView } from "./TodoCardView";
import type { TodoPageController } from "@/controllers/useTodoPageController";

export type TodoDashboardViewProps = {
  controller: TodoPageController;
};

export function TodoDashboardView({ controller }: TodoDashboardViewProps) {
  const {
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
    toggleShowDone,
    handleSubmit,
    startEdit,
    cancelEdit,
    saveEdit,
    toggleTodo,
    deleteTodo,
    updateEditingValue,
  } = controller;

  const [referenceTime, setReferenceTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setReferenceTime(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

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
            onChange={(event) => setContent(event.target.value)}
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
          activeTodos.map((todo) => (
            <TodoCardView
              key={todo.id}
              todo={todo}
              referenceTime={referenceTime}
              isEditing={editingId === todo.id}
              editingValue={editingValue}
              onEditingChange={updateEditingValue}
              onStartEdit={startEdit}
              onCancelEdit={cancelEdit}
              onSaveEdit={saveEdit}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          ))
        )}
      </div>

      {doneTodos.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Tâches terminées</h2>
            <Button variant="outline" size="sm" onClick={toggleShowDone}>
              {showDone ? "Masquer" : "Afficher"} ({doneTodos.length})
            </Button>
          </div>

          {showDone && (
            <div className="mt-3 space-y-3">
              {doneTodos.map((todo) => (
                <TodoCardView
                  key={todo.id}
                  todo={todo}
                  referenceTime={referenceTime}
                  isEditing={editingId === todo.id}
                  editingValue={editingValue}
                  onEditingChange={updateEditingValue}
                  onStartEdit={startEdit}
                  onCancelEdit={cancelEdit}
                  onSaveEdit={saveEdit}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
