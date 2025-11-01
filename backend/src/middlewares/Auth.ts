import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../interfaces/AuthInterface';
import { JwtPayload } from '../interfaces/jwt';

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = {
      id: decoded.id,  
      email: decoded.email
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
