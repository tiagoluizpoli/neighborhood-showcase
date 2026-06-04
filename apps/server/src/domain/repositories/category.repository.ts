export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CategoryRepository {
  listActive(): Promise<CategoryDTO[]>;
  findById(id: string): Promise<CategoryDTO | null>;
}
