export interface DeleteTodoInput {
  id: number;
}

export interface DeleteTodoUseCase {
  execute(input: DeleteTodoInput): Promise<boolean>;
}
