import type { Todo } from '../entities/todo.entity';

export interface CreateTodoRepositoryInput {
  text: string;
}

export interface ToggleTodoRepositoryInput {
  id: number;
  completed: boolean;
}

export interface DeleteTodoRepositoryInput {
  id: number;
}

export interface TodoRepository {
  getAll(): Promise<Todo[]>;
  create(input: CreateTodoRepositoryInput): Promise<Todo>;
  toggle(input: ToggleTodoRepositoryInput): Promise<Todo | null>;
  delete(input: DeleteTodoRepositoryInput): Promise<boolean>;
}
