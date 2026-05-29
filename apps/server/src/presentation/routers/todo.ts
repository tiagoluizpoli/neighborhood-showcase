import { z } from 'zod';
import { CreateTodo } from '../../application/use-cases/todo/create-todo';
import { DeleteTodo } from '../../application/use-cases/todo/delete-todo';
import { GetTodos } from '../../application/use-cases/todo/get-todos';
import { ToggleTodo } from '../../application/use-cases/todo/toggle-todo';
import { DrizzleTodoRepository } from '../../infrastructure/db/todo-repository';
import { publicProcedure, router } from '../trpc';

const todoRepo = new DrizzleTodoRepository();
const getTodosUseCase = new GetTodos(todoRepo);
const createTodoUseCase = new CreateTodo(todoRepo);
const toggleTodoUseCase = new ToggleTodo(todoRepo);
const deleteTodoUseCase = new DeleteTodo(todoRepo);

export const todoRouter = router({
  getAll: publicProcedure.query(async () => {
    return getTodosUseCase.execute();
  }),

  create: publicProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return createTodoUseCase.execute({ text: input.text });
    }),

  toggle: publicProcedure
    .input(z.object({ id: z.number(), completed: z.boolean() }))
    .mutation(async ({ input }) => {
      return toggleTodoUseCase.execute({
        id: input.id,
        completed: input.completed,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteTodoUseCase.execute({ id: input.id });
    }),
});
