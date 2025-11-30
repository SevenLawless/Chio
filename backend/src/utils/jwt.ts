import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;
  username: string;
}

type JwtExpiresIn = jwt.SignOptions['expiresIn'];

export const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.jwtSecret as jwt.Secret, {
    expiresIn: env.jwtExpiresIn as JwtExpiresIn,
  });

export const verifyToken = (token: string) =>
  jwt.verify(token, env.jwtSecret as jwt.Secret) as JwtPayload;

