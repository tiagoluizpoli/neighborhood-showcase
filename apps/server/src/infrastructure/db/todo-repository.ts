import { db } from '@neighborhood-showcase/db';
import { todo as todoSchema } from '@neighborhood-showcase/db/schema/todo';
import { eq } from 'drizzle-orm';
import type { Todo } from '../../domain/entities/todo.entity';
import type {
  CreateTodoRepositoryInput,
  DeleteTodoRepositoryInput,
  TodoRepository,
  ToggleTodoRepositoryInput,
} from '../../domain/repositories/todo.repository';

export class DrizzleTodoRepository implements TodoRepository {
  async getAll(): Promise<Todo[]> {
    return db.select().from(todoSchema);
  }

  async create(input: CreateTodoRepositoryInput): Promise<Todo> {
    const [inserted] = await db
      .insert(todoSchema)
      .values({
        text: input.text,
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to create todo');
    }

    return inserted;
  }

  async toggle(input: ToggleTodoRepositoryInput): Promise<Todo | null> {
    const [updated] = await db
      .update(todoSchema)
      .set({ completed: input.completed })
      .where(eq(todoSchema.id, input.id))
      .returning();

    return updated || null;
  }

  async delete(input: DeleteTodoRepositoryInput): Promise<boolean> {
    const result = await db
      .delete(todoSchema)
      .where(eq(todoSchema.id, input.id))
      .returning();

    return result.length > 0;
  }
}
