import type { Todo } from '../../entities/todo.entity';

export interface ToggleTodoInput {
  id: number;
  completed: boolean;
}

export interface ToggleTodoUseCase {
  execute(input: ToggleTodoInput): Promise<Todo | null>;
}
