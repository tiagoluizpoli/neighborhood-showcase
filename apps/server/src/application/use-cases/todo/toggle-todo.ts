import type { Todo } from '../../../domain/entities/todo.entity';
import type { TodoRepository } from '../../../domain/repositories/todo.repository';
import type {
  ToggleTodoInput,
  ToggleTodoUseCase,
} from '../../../domain/use-cases/todo/toggle-todo.use-case';

export class ToggleTodo implements ToggleTodoUseCase {
  constructor(private readonly todoRepo: TodoRepository) {}

  async execute(input: ToggleTodoInput): Promise<Todo | null> {
    return this.todoRepo.toggle({ id: input.id, completed: input.completed });
  }
}
