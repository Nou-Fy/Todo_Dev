export type TodoDto = {
  id: number;
  content: string;
  status: boolean;
  createdAt: string;
  completedAt: string | null;
};

const API_ROUTE = "/api/todos";

async function parseApiError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // Ignore parsing errors and continue with fallback text.
  }
  return fallback;
}

async function handleResponse<T>(response: Response, fallback: string) {
  if (!response.ok) {
    throw new Error(await parseApiError(response, fallback));
  }
  return (await response.json()) as T;
}

const defaultHeaders = { "Content-Type": "application/json" };

export async function loadTodosFromApi() {
  const response = await fetch(API_ROUTE);
  return handleResponse<TodoDto[]>(
    response,
    "Erreur lors de la récupération des todos",
  );
}

export async function createTodoViaApi(content: string) {
  const response = await fetch(API_ROUTE, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({ content }),
  });
  return handleResponse<TodoDto>(
    response,
    "Erreur lors de la création du todo",
  );
}

export async function softDeleteTodoViaApi(id: number) {
  const response = await fetch(API_ROUTE, {
    method: "DELETE",
    headers: defaultHeaders,
    body: JSON.stringify({ id }),
  });
  return handleResponse<TodoDto | null>(
    response,
    "Erreur lors de la suppression du todo",
  );
}

export async function updateTodoViaApi(id: number, payload: {
  content?: string;
  status?: boolean;
}) {
  const response = await fetch(API_ROUTE, {
    method: "PATCH",
    headers: defaultHeaders,
    body: JSON.stringify({ id, ...payload }),
  });
  return handleResponse<TodoDto | null>(
    response,
    "Erreur lors de la mise à jour du todo",
  );
}
