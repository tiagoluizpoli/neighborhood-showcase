import type {
  CategoryDTO,
  CategoryRepository,
} from '../../../domain/repositories/category.repository';

export class ListActiveCategories {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  async execute(): Promise<CategoryDTO[]> {
    return this.categoryRepo.listActive();
  }
}
