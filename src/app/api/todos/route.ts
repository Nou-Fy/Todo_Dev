import {
  handleDeleteTodo,
  handleGetTodos,
  handlePatchTodo,
  handlePostTodo,
} from "@/controllers/api/todoApiController";

export { handleGetTodos as GET };
export { handlePostTodo as POST };
export { handleDeleteTodo as DELETE };
export { handlePatchTodo as PATCH };
