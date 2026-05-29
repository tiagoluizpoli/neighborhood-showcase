import type { Todo } from '../../entities/todo.entity';

export interface CreateTodoInput {
  text: string;
}

export interface CreateTodoUseCase {
  execute(input: CreateTodoInput): Promise<Todo>;
}
