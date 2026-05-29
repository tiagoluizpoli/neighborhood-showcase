import type { Todo } from '../../../domain/entities/todo.entity';
import { validateTodoText } from '../../../domain/entities/todo.entity';
import type { TodoRepository } from '../../../domain/repositories/todo.repository';
import type {
  CreateTodoInput,
  CreateTodoUseCase,
} from '../../../domain/use-cases/todo/create-todo.use-case';

export class CreateTodo implements CreateTodoUseCase {
  constructor(private readonly todoRepo: TodoRepository) {}

  async execute(input: CreateTodoInput): Promise<Todo> {
    validateTodoText(input.text);
    return this.todoRepo.create({ text: input.text });
  }
}
