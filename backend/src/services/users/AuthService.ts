// services/users/AuthService.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/Prisma';
import { EmailService } from '../email/EmailService';

export class AuthService {
  static async checkEmailExists(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      throw new Error('Email já registrado');
    }

    return { message: 'Email disponível' };
  }

  static async verifyEmailExists(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error('Email não cadastrado');
    }

    return { message: 'Email encontrado' };
  }

  static async checkResetCode(email: string, code: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.resetCode) {
      throw new Error('Código inválido');
    }

    if (user.resetCode !== code) {
      throw new Error('Código inválido');
    }

    if (user.resetCodeExpires && user.resetCodeExpires < new Date()) {
      throw new Error('Código expirado');
    }

    return { message: 'Código válido' };
  }

  static async register(
    name: string, 
    email: string, 
    password: string, 
    avatar?: string,
    phone?: string,
    cnpj?: string,
    companyName?: string,
    professionalFullName?: string
  ) {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      throw new Error('Email já registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        avatar,
        phone,
        cnpj,
        companyName,
        professionalFullName,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        cnpj: user.cnpj,
        companyName: user.companyName,
        professionalFullName: user.professionalFullName,
      },
      token
    };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      throw new Error('Senha inválida');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        cnpj: user.cnpj,
        companyName: user.companyName,
        professionalFullName: user.professionalFullName,
      },
      token
    };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        cnpj: true,
        companyName: true,
        professionalFullName: true,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return { user };
  }

  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error('Email não cadastrado');
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        resetCode,
        resetCodeExpires
      }
    });

    await EmailService.sendResetCode(email, resetCode);

    return { message: 'Código enviado para o email' };
  }

  static async verifyResetCode(email: string, code: string) {
    const result = await this.checkResetCode(email, code);
    return result;
  }

  static async resetPassword(email: string, code: string, newPassword: string) {
    await this.checkResetCode(email, code);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpires: null
      }
    });

    return { message: 'Senha alterada com sucesso' };
  }

  static async updateProfile(userId: string, userData: {
    name?: string;
    email?: string;
    avatar?: string;
    phone?: string;
    cnpj?: string;
    companyName?: string;
    professionalFullName?: string;
  }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (userData.email && userData.email !== user.email) {
      const emailExists = await prisma.user.findUnique({ 
        where: { email: userData.email } 
      });
      
      if (emailExists) {
        throw new Error('Email já está em uso');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(userData.name && { name: userData.name }),
        ...(userData.email && { email: userData.email }),
        ...(userData.avatar !== undefined && { avatar: userData.avatar }),
        ...(userData.phone !== undefined && { phone: userData.phone }),
        ...(userData.cnpj !== undefined && { cnpj: userData.cnpj }),
        ...(userData.companyName !== undefined && { companyName: userData.companyName }),
        ...(userData.professionalFullName !== undefined && { professionalFullName: userData.professionalFullName }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        cnpj: true,
        companyName: true,
        professionalFullName: true,
      }
    });

    return { user: updatedUser };
  }
}