import { Request, Response } from 'express';
import { prisma } from '../../lib/Prisma';
import bcrypt from 'bcrypt';

export class UserController {
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { name,  currentPassword, newPassword, avatar } = req.body;
      
      const updateData: any = {};
      
      if (name) updateData.name = name;
      if (avatar) updateData.avatar = avatar;
       
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Senha atual é obrigatória para alterar a senha' });
        }
        
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
          return res.status(400).json({ error: 'Senha atual inválida' });
        }
        
        updateData.password = await bcrypt.hash(newPassword, 10);
      }


      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      });
      
      return res.status(200).json({ 
        message: 'Perfil atualizado com sucesso',
        user: updatedUser
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}