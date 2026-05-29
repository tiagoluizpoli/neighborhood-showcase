export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export function validateTodoText(text: string): void {
  if (!text || text.trim().length === 0) {
    throw new Error('Todo text cannot be empty');
  }
}
