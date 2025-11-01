import { Request } from 'express';

export interface AuthUser {
  id: string; 
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  file?: Express.Multer.File;
}

export interface JwtPayload {
  id: string; 
  email: string;
}