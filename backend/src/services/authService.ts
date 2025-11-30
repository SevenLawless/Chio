import bcrypt from 'bcrypt';
import { query, queryOne } from '../utils/prisma';
import { HttpError } from '../utils/errors';
import { signToken } from '../utils/jwt';
import { randomUUID } from 'crypto';

const SALT_ROUNDS = 10;

interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export const registerUser = async (username: string, password: string) => {
  // Validate username
  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 3) {
    throw new HttpError(400, 'Username must be at least 3 characters');
  }
  if (trimmedUsername.length > 50) {
    throw new HttpError(400, 'Username must be 50 characters or less');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
    throw new HttpError(400, 'Username can only contain letters, numbers, hyphens, and underscores');
  }
  
  // Check if username exists
  const existing = await queryOne<User>(
    'SELECT * FROM User WHERE username = ?',
    [trimmedUsername]
  );

  if (existing) {
    throw new HttpError(409, 'Username already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = randomUUID();
  const now = new Date();

  await query(
    'INSERT INTO User (id, username, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
    [id, trimmedUsername, passwordHash, now, now]
  );

  const token = signToken({ sub: id, username: trimmedUsername });

  return { user: { id, username: trimmedUsername }, token };
};

export const loginUser = async (username: string, password: string) => {
  const user = await queryOne<User>(
    'SELECT * FROM User WHERE username = ?',
    [username]
  );

  if (!user) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const token = signToken({ sub: user.id, username: user.username });

  return { user: { id: user.id, username: user.username }, token };
};

