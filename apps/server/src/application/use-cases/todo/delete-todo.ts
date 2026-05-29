import type { TodoRepository } from '../../../domain/repositories/todo.repository';
import type {
  DeleteTodoInput,
  DeleteTodoUseCase,
} from '../../../domain/use-cases/todo/delete-todo.use-case';

export class DeleteTodo implements DeleteTodoUseCase {
  constructor(private readonly todoRepo: TodoRepository) {}

  async execute(input: DeleteTodoInput): Promise<boolean> {
    return this.todoRepo.delete({ id: input.id });
  }
}
