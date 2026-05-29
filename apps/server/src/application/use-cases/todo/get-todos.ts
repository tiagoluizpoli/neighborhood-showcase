import type { Todo } from '../../../domain/entities/todo.entity';
import type { TodoRepository } from '../../../domain/repositories/todo.repository';
import type { GetTodosUseCase } from '../../../domain/use-cases/todo/get-todos.use-case';

export class GetTodos implements GetTodosUseCase {
  constructor(private readonly todoRepo: TodoRepository) {}

  async execute(): Promise<Todo[]> {
    return this.todoRepo.getAll();
  }
}
