import type { Todo } from '../../entities/todo.entity';

export interface GetTodosUseCase {
  execute(): Promise<Todo[]>;
}
