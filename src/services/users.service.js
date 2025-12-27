import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

export const getAllUsers = async () => {
  try {
    return await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      created_at: users.created_at,
      updated_at: users.updated_at
    }).from(users);
  } catch (e) {
    logger.error('Error getting all users', e);
    throw e;
  }
};

export const getUserById = async (id) => {
  try {
    const result = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      created_at: users.created_at,
      updated_at: users.updated_at
    }).from(users).where(eq(users.id, id));

    if (result.length === 0) {
      throw new Error('User not found');
    }

    return result[0];
  } catch (e) {
    logger.error(`Error getting user by id ${id}`, e);
    throw e;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const existingUser = await db.select().from(users).where(eq(users.id, id));

    if (existingUser.length === 0) {
      throw new Error('User not found');
    }

    const updatedData = {
      ...updates,
      updated_at: new Date()
    };

    const result = await db.update(users)
      .set(updatedData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at
      });

    return result[0];
  } catch (e) {
    logger.error(`Error updating user ${id}`, e);
    throw e;
  }
};

export const deleteUser = async (id) => {
  try {
    const existingUser = await db.select().from(users).where(eq(users.id, id));

    if (existingUser.length === 0) {
      throw new Error('User not found');
    }

    await db.delete(users).where(eq(users.id, id));

    return { message: 'User deleted successfully' };
  } catch (e) {
    logger.error(`Error deleting user ${id}`, e);
    throw e;
  }
};
