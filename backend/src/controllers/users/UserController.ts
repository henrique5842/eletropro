import { Request, Response } from 'express';
import { prisma } from '../../lib/Prisma';
import fs from 'fs';
import path from 'path';

export class UserController {
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

 
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(user);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }


  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { name, email, username, birthDate } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { name, email },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true
        }
      });

      return res.status(200).json(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  
  static async updateAvatar(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const avatarFile = req.file;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!avatarFile) {
        return res.status(400).json({ error: 'No avatar file provided' });
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(avatarFile.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.' });
      }

      const avatarUrl = `/uploads/avatars/${avatarFile.filename}`;

      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatar: true }
      });

      if (currentUser?.avatar) {
        const oldAvatarPath = path.resolve(__dirname, '../../public', currentUser.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true
        }
      });

      return res.status(200).json(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
