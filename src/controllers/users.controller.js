import logger from '#config/logger.js';
import { getAllUsers, getUserById, updateUser, deleteUser } from '#services/users.service.js';
import { userIdSchema, updateUserSchema } from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';
import { hashPassword } from '#services/auth.service.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users...');

    const allUsers = await getAllUsers();

    res.json({
      message: 'Successfully retrieved all users.',
      users: allUsers,
      userCount: allUsers.length
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const fetchUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error)
      });
    }

    const { id } = validationResult.data;

    logger.info(`Getting user with id ${id}...`);

    const user = await getUserById(id);

    res.json({
      message: 'Successfully retrieved user.',
      user
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const modifyUser = async (req, res, next) => {
  try {
    const idValidationResult = userIdSchema.safeParse(req.params);

    if (!idValidationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idValidationResult.error)
      });
    }

    const bodyValidationResult = updateUserSchema.safeParse(req.body);

    if (!bodyValidationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidationResult.error)
      });
    }

    const { id } = idValidationResult.data;
    const updates = bodyValidationResult.data;

    // Check if user is trying to update their own profile or is an admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own profile'
      });
    }

    // Only admin users can change role
    if (updates.role && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can change user roles'
      });
    }

    // Hash password if it's being updated
    if (updates.password)
      updates.password = await hashPassword(updates.password);

    logger.info(`Updating user with id ${id}...`);

    const updatedUser = await updateUser(id, updates);

    res.json({
      message: 'Successfully updated user.',
      user: updatedUser
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const removeUser = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error)
      });
    }

    const { id } = validationResult.data;

    logger.info(`Deleting user with id ${id}...`);

    await deleteUser(id);

    res.json({
      message: 'Successfully deleted user.'
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};
