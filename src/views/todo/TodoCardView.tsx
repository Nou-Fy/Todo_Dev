"use client";

import { Button } from "@/views/ui/button";
import { Input } from "@/views/ui/input";
import { Edit, Trash2 } from "lucide-react";
import type { Todo } from "@/controllers/todoStateController";

export type TodoCardViewProps = {
  todo: Todo;
  referenceTime: number;
  isEditing: boolean;
  editingValue: string;
  onEditingChange: (value: string) => void;
  onStartEdit: (id: number, initial: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: number) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

const formatDateTime = (date: Date) =>
  date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export function TodoCardView({
  todo,
  referenceTime,
  isEditing,
  editingValue,
  onEditingChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggle,
  onDelete,
}: TodoCardViewProps) {
  const created = new Date(todo.createdAt);
  const createdOk = !Number.isNaN(created.getTime());
  const deadline = createdOk
    ? new Date(created.getTime() + 24 * 60 * 60 * 1000)
    : null;

  const completed = todo.completedAt ? new Date(todo.completedAt) : null;
  const completedOk = completed != null && !Number.isNaN(completed.getTime());
  const completionDurationMs =
    completedOk && createdOk ? completed.getTime() - created.getTime() : null;
  const completedWithinDay =
    completionDurationMs != null && completionDurationMs <= 24 * 60 * 60 * 1000;
  const completedBeyondDay =
    completionDurationMs != null && completionDurationMs > 24 * 60 * 60 * 1000;

  const isOverdue = deadline ? referenceTime > deadline.getTime() : false;
  const isCreatedWithinDay =
    createdOk && referenceTime - created.getTime() < 24 * 60 * 60 * 1000;

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border bg-card/75 p-4 shadow-sm backdrop-blur hover:border-primary">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={todo.status}
          onChange={() => onToggle(todo.id)}
          className="mt-1 h-5 w-5 rounded border-border text-primary focus-visible:ring-ring"
        />
        <div className="flex-1">
          {isEditing && !todo.status ? (
            <div className="flex items-center gap-2">
              <Input
                value={editingValue}
                onChange={(event) => onEditingChange(event.target.value)}
              />
              <Button size="sm" onClick={() => onSaveEdit(todo.id)}>
                Enregistrer
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancelEdit}>
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
                  (completedWithinDay
                    ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-300"
                    : completedBeyondDay
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-border bg-muted text-muted-foreground")
                }>
                Fait le :{" "}
                {completedOk && completed ? formatDateTime(completed) : "—"}
                {completedOk && deadline ? "" : ""}
              </span>
            ) : (
              <span
                className={
                  "inline-flex items-center rounded-md border px-2 py-1 text-xs " +
                  (isOverdue
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : isCreatedWithinDay
                      ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-300"
                      : "border-border bg-muted text-muted-foreground")
                }>
                Deadline : {deadline ? formatDateTime(deadline) : "—"} (+24h)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {todo.status || isEditing ? null : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onStartEdit(todo.id, todo.content)}>
            Modifier <Edit />
          </Button>
        )}

        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(todo.id)}>
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
