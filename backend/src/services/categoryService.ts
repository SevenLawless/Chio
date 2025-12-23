import { query, queryOne } from '../utils/prisma';
import { HttpError } from '../utils/errors';
import { randomUUID } from 'crypto';

interface Category {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Task {
  id: string;
  category: string;
}

// Default categories that should exist for all users
const DEFAULT_CATEGORIES = [
  { name: 'MAIN', color: null },
  { name: 'MORNING', color: null },
  { name: 'FOOD', color: null },
  { name: 'BOOKS', color: null },
  { name: 'COURSES', color: null },
];

export const listCategories = async (userId: string): Promise<Category[]> => {
  // Get all user categories
  const categories = await query<Category>(
    `SELECT * FROM Category 
     WHERE userId = ? 
     ORDER BY \`order\` ASC, createdAt ASC`,
    [userId]
  );

  // If user has no categories, create default ones
  if (categories.length === 0) {
    await createDefaultCategories(userId);
    return await listCategories(userId);
  }

  return categories;
};

const createDefaultCategories = async (userId: string): Promise<void> => {
  const now = new Date();
  
  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const cat = DEFAULT_CATEGORIES[i];
    const id = randomUUID();
    await query(
      'INSERT INTO Category (id, userId, name, color, `order`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, cat.name, cat.color, i, now, now]
    );
  }
};

export const createCategory = async (userId: string, input: { name: string; color?: string | null }) => {
  const name = input.name?.trim();
  
  if (!name || name.length === 0) {
    throw new HttpError(400, 'Category name is required');
  }

  if (name.length > 191) {
    throw new HttpError(400, 'Category name must be 191 characters or less');
  }

  // Check if category with same name already exists for this user
  const existing = await queryOne<Category>(
    'SELECT * FROM Category WHERE userId = ? AND name = ?',
    [userId, name]
  );

  if (existing) {
    throw new HttpError(409, 'Category with this name already exists');
  }

  // Get max order
  const maxOrderResult = await queryOne<{ maxOrder: number }>(
    'SELECT COALESCE(MAX(`order`), -1) as maxOrder FROM Category WHERE userId = ?',
    [userId]
  );
  const newOrder = (maxOrderResult?.maxOrder ?? -1) + 1;

  const id = randomUUID();
  const now = new Date();
  const color = input.color?.trim() || null;

  await query(
    'INSERT INTO Category (id, userId, name, color, `order`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId, name, color, newOrder, now, now]
  );

  return await queryOne<Category>('SELECT * FROM Category WHERE id = ?', [id]);
};

export const updateCategory = async (userId: string, categoryId: string, input: Partial<{ name: string; color: string | null }>) => {
  const category = await queryOne<Category>(
    'SELECT * FROM Category WHERE id = ? AND userId = ?',
    [categoryId, userId]
  );

  if (!category) {
    throw new HttpError(404, 'Category not found');
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name || name.length === 0) {
      throw new HttpError(400, 'Category name cannot be empty');
    }
    if (name.length > 191) {
      throw new HttpError(400, 'Category name must be 191 characters or less');
    }

    // Check if another category with this name exists
    const existing = await queryOne<Category>(
      'SELECT * FROM Category WHERE userId = ? AND name = ? AND id != ?',
      [userId, name, categoryId]
    );

    if (existing) {
      throw new HttpError(409, 'Category with this name already exists');
    }

    updates.push('name = ?');
    values.push(name);
  }

  if (input.color !== undefined) {
    updates.push('color = ?');
    values.push(input.color?.trim() || null);
  }

  if (updates.length === 0) {
    return category;
  }

  updates.push('updatedAt = CURRENT_TIMESTAMP(3)');
  values.push(categoryId);

  await query(
    `UPDATE Category SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return await queryOne<Category>('SELECT * FROM Category WHERE id = ?', [categoryId]);
};

export const deleteCategory = async (userId: string, categoryId: string) => {
  const category = await queryOne<Category>(
    'SELECT * FROM Category WHERE id = ? AND userId = ?',
    [categoryId, userId]
  );

  if (!category) {
    throw new HttpError(404, 'Category not found');
  }

  // Check if any tasks are using this category
  const tasksUsingCategory = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM Task WHERE category = ? AND userId = ? AND isCancelled = FALSE',
    [category.name, userId]
  );

  if (tasksUsingCategory && tasksUsingCategory.count > 0) {
    throw new HttpError(400, 'Cannot delete category that is in use by tasks');
  }

  await query('DELETE FROM Category WHERE id = ?', [categoryId]);
  
  return category;
};

