import { PrismaClient, Budget, BudgetItem, BudgetStatus, DiscountType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

interface BudgetFilters {
  clientId?: string;
  status?: BudgetStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface DiscountData {
  discount: number;
  discountType: DiscountType;
  discountReason?: string;
}

// Interface para o usuário autenticado
interface AuthenticatedUser {
  id: string;
  email: string;
}

export const budgetService = {
  // Criar orçamento
  async createBudget(data: {
    name: string;
    clientId: string;
    userId: string;
    status?: BudgetStatus;
    notes?: string;
    validUntil?: string;
    discount?: number;
    discountType?: DiscountType;
    discountReason?: string;
  }): Promise<Budget> {
    return await prisma.$transaction(async (tx) => {
      // Verificar se o cliente existe e pertence ao usuário
      const client = await tx.client.findFirst({
        where: { 
          id: data.clientId, 
          userId: data.userId 
        }
      });

      if (!client) {
        throw new Error('Cliente não encontrado');
      }

      // Gerar link de acesso único
      const accessLink = uuidv4();

      const budget = await tx.budget.create({
        data: {
          name: data.name,
          clientId: data.clientId,
          userId: data.userId,
          status: data.status || 'PENDING',
          notes: data.notes,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          discount: data.discount,
          discountType: data.discountType,
          discountReason: data.discountReason,
          accessLink,
          subtotal: 0,
          totalValue: 0
        },
        include: {
          client: true,
          items: {
            include: {
              service: true,
              material: true
            }
          }
        }
      });

      return budget;
    });
  },

  // Listar orçamentos com filtros
  async listBudgets(professionalId: string, filters: BudgetFilters = {}) {
    const where: any = {
      userId: professionalId
    };

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { client: { fullName: { contains: filters.search, mode: 'insensitive' } } },
        { notes: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true
          }
        },
        items: {
          include: {
            service: true,
            material: true
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return budgets;
  },

  // Buscar orçamento por ID
  async getBudgetById(id: string, professionalId: string) {
    const budget = await prisma.budget.findFirst({
      where: { 
        id, 
        userId: professionalId 
      },
      include: {
        client: true,
        items: {
          include: {
            service: true,
            material: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!budget) {
      throw new Error('Orçamento não encontrado');
    }

    return budget;
  },

  // Atualizar orçamento
  async updateBudget(id: string, professionalId: string, data: any) {
    const budget = await prisma.budget.findFirst({
      where: { 
        id, 
        userId: professionalId 
      }
    });

    if (!budget) {
      throw new Error('Orçamento não encontrado');
    }

    if (budget.status !== 'PENDING') {
      throw new Error('Só é possível editar orçamentos pendentes');
    }

    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: {
        name: data.name,
        notes: data.notes,
        validUntil: data.validUntil ? new Date(data.validUntil) : null
      },
      include: {
        client: true,
        items: {
          include: {
            service: true,
            material: true
          }
        }
      }
    });

    return updatedBudget;
  },

  // Atualizar status do orçamento
  async updateBudgetStatus(id: string, professionalId: string, status: BudgetStatus) {
    return await prisma.$transaction(async (tx) => {
      const budget = await tx.budget.findFirst({
        where: { 
          id, 
          userId: professionalId 
        }
      });

      if (!budget) {
        throw new Error('Orçamento não encontrado');
    }

      const updateData: any = { status };

      if (status === 'APPROVED') {
        updateData.approvedAt = new Date();
        updateData.rejectedAt = null;
        updateData.rejectionReason = null;
      } else if (status === 'REJECTED') {
        updateData.rejectedAt = new Date();
        updateData.approvedAt = null;
      } else {
        updateData.approvedAt = null;
        updateData.rejectedAt = null;
        updateData.rejectionReason = null;
      }

      const updatedBudget = await tx.budget.update({
        where: { id },
        data: updateData,
        include: {
          client: true,
          items: {
            include: {
              service: true,
              material: true
            }
          }
        }
      });

      return updatedBudget;
    });
  },

  // Aplicar desconto
  async applyDiscount(id: string, professionalId: string, discountData: DiscountData) {
    return await prisma.$transaction(async (tx) => {
      const budget = await tx.budget.findFirst({
        where: { 
          id, 
          userId: professionalId 
        },
        include: {
          items: true
        }
      });

      if (!budget) {
        throw new Error('Orçamento não encontrado');
      }

      if (budget.status !== 'PENDING') {
        throw new Error('Só é possível aplicar desconto em orçamentos pendentes');
      }

      const subtotal = budget.items.reduce((total, item) => total + item.totalPrice, 0);
      
      let discountValue = 0;
      if (discountData.discountType === 'PERCENTAGE') {
        discountValue = (subtotal * discountData.discount) / 100;
      } else {
        discountValue = discountData.discount;
      }

      const totalValue = Math.max(0, subtotal - discountValue);

      const updatedBudget = await tx.budget.update({
        where: { id },
        data: {
          discount: discountData.discount,
          discountType: discountData.discountType,
          discountReason: discountData.discountReason,
          subtotal,
          totalValue
        },
        include: {
          client: true,
          items: {
            include: {
              service: true,
              material: true
            }
          }
        }
      });

      return updatedBudget;
    });
  },

  // Remover desconto
  async removeDiscount(id: string, professionalId: string) {
    return await prisma.$transaction(async (tx) => {
      const budget = await tx.budget.findFirst({
        where: { 
          id, 
          userId: professionalId 
        },
        include: {
          items: true
        }
      });

      if (!budget) {
        throw new Error('Orçamento não encontrado');
      }

      if (budget.status !== 'PENDING') {
        throw new Error('Só é possível remover desconto de orçamentos pendentes');
      }

      const subtotal = budget.items.reduce((total, item) => total + item.totalPrice, 0);

      const updatedBudget = await tx.budget.update({
        where: { id },
        data: {
          discount: null,
          discountType: null,
          discountReason: null,
          subtotal,
          totalValue: subtotal
        },
        include: {
          client: true,
          items: {
            include: {
              service: true,
              material: true
            }
          }
        }
      });

      return updatedBudget;
    });
  },

  // Deletar orçamento
  async deleteBudget(id: string, professionalId: string) {
    const budget = await prisma.budget.findFirst({
      where: { 
        id, 
        userId: professionalId 
      }
    });

    if (!budget) {
      throw new Error('Orçamento não encontrado');
    }

    await prisma.budget.delete({
      where: { id }
    });
  },

  // Adicionar item ao orçamento
  async addBudgetItem(budgetId: string, professionalId: string, itemData: any) {
    return await prisma.$transaction(async (tx) => {
      const budget = await tx.budget.findFirst({
        where: { 
          id: budgetId, 
          userId: professionalId 
        }
      });

      if (!budget) {
        throw new Error('Orçamento não encontrado');
      }

      if (budget.status !== 'PENDING') {
        throw new Error('Só é possível adicionar itens a orçamentos pendentes');
      }

      // Verificar se serviço ou material existe e pertence ao usuário
      if (itemData.serviceId) {
        const service = await tx.service.findFirst({
          where: { 
            id: itemData.serviceId, 
            userId: professionalId 
          }
        });

        if (!service) {
          throw new Error('Serviço não encontrado');
        }

        itemData.unitPrice = service.price;
        itemData.unit = service.unit;
        itemData.name = service.name;
      }

      if (itemData.materialId) {
        const material = await tx.material.findFirst({
          where: { 
            id: itemData.materialId, 
            userId: professionalId 
          }
        });

        if (!material) {
          throw new Error('Material não encontrado');
        }

        itemData.unitPrice = material.price;
        itemData.unit = material.unit;
        itemData.name = material.name;
      }

      const totalPrice = itemData.quantity * itemData.unitPrice;

      const item = await tx.budgetItem.create({
        data: {
          ...itemData,
          budgetId,
          totalPrice
        },
        include: {
          service: true,
          material: true
        }
      });

      // Recalcular totais do orçamento
      await this.recalculateBudgetTotals(budgetId, tx);

      return item;
    });
  },

  // Atualizar item do orçamento
  async updateBudgetItem(budgetId: string, itemId: string, professionalId: string, itemData: any) {
    return await prisma.$transaction(async (tx) => {
      const budget = await tx.budget.findFirst({
        where: { 
          id: budgetId, 
          userId: professionalId 
        }
      });

      if (!budget) {
        throw new Error('Orçamento não encontrado');
      }

      if (budget.status !== 'PENDING') {
        throw new Error('Só é possível editar itens de orçamentos pendentes');
      }

      const item = await tx.budgetItem.findFirst({
        where: { 
          id: itemId, 
          budgetId 
        }
      });

      if (!item) {
        throw new Error('Item não encontrado');
      }

      const updateData: any = { ...itemData };

      // Recalcular preço total se quantidade ou preço unitário mudar
      if (itemData.quantity !== undefined || itemData.unitPrice !== undefined) {
        const quantity = itemData.quantity !== undefined ? itemData.quantity : item.quantity;
        const unitPrice = itemData.unitPrice !== undefined ? itemData.unitPrice : item.unitPrice;
        updateData.totalPrice = quantity * unitPrice;
      }

      const updatedItem = await tx.budgetItem.update({
        where: { id: itemId },
        data: updateData,
        include: {
          service: true,
          material: true
        }
      });

      // Recalcular totais do orçamento
      await this.recalculateBudgetTotals(budgetId, tx);

      return updatedItem;
    });
  },

  // Remover item do orçamento
  async removeBudgetItem(budgetId: string, itemId: string, professionalId: string) {
    return await prisma.$transaction(async (tx) => {
      const budget = await tx.budget.findFirst({
        where: { 
          id: budgetId, 
          userId: professionalId 
        }
      });

      if (!budget) {
        throw new Error('Orçamento não encontrado');
      }

      if (budget.status !== 'PENDING') {
        throw new Error('Só é possível remover itens de orçamentos pendentes');
      }

      const item = await tx.budgetItem.findFirst({
        where: { 
          id: itemId, 
          budgetId 
        }
      });

      if (!item) {
        throw new Error('Item não encontrado');
      }

      await tx.budgetItem.delete({
        where: { id: itemId }
      });

      // Recalcular totais do orçamento
      await this.recalculateBudgetTotals(budgetId, tx);
    });
  },

  // Recalcular totais do orçamento
  async recalculateBudgetTotals(budgetId: string, tx: any) {
    const items = await tx.budgetItem.findMany({
      where: { budgetId }
    });

    const subtotal = items.reduce((total: number, item: BudgetItem) => total + item.totalPrice, 0);

    const budget = await tx.budget.findUnique({
      where: { id: budgetId }
    });

    let discountValue = 0;
    if (budget.discount && budget.discountType) {
      if (budget.discountType === 'PERCENTAGE') {
        discountValue = (subtotal * budget.discount) / 100;
      } else {
        discountValue = budget.discount;
      }
    }

    const totalValue = Math.max(0, subtotal - discountValue);

    await tx.budget.update({
      where: { id: budgetId },
      data: {
        subtotal,
        totalValue
      }
    });
  },

  // Duplicar orçamento
  async duplicateBudget(originalBudgetId: string, professionalId: string, newName: string) {
    return await prisma.$transaction(async (tx) => {
      const originalBudget = await tx.budget.findFirst({
        where: { 
          id: originalBudgetId, 
          userId: professionalId 
        },
        include: {
          items: true
        }
      });

      if (!originalBudget) {
        throw new Error('Orçamento original não encontrado');
      }

      // Criar novo orçamento
      const newBudget = await tx.budget.create({
        data: {
          name: newName,
          clientId: originalBudget.clientId,
          userId: professionalId,
          status: 'PENDING',
          notes: originalBudget.notes,
          validUntil: originalBudget.validUntil,
          discount: originalBudget.discount,
          discountType: originalBudget.discountType,
          discountReason: originalBudget.discountReason,
          accessLink: uuidv4(),
          subtotal: 0,
          totalValue: 0
        }
      });

      // Duplicar itens
      if (originalBudget.items.length > 0) {
        for (const item of originalBudget.items) {
          await tx.budgetItem.create({
            data: {
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              unit: item.unit,
              budgetId: newBudget.id,
              serviceId: item.serviceId,
              materialId: item.materialId
            }
          });
        }
      }

      // Recalcular totais
      await this.recalculateBudgetTotals(newBudget.id, tx);

      return await tx.budget.findUnique({
        where: { id: newBudget.id },
        include: {
          client: true,
          items: {
            include: {
              service: true,
              material: true
            }
          }
        }
      });
    });
  },

  // Buscar orçamentos por cliente
  async getBudgetsByClient(clientId: string, professionalId: string) {
    const budgets = await prisma.budget.findMany({
      where: { 
        clientId, 
        userId: professionalId 
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true
          }
        },
        items: {
          include: {
            service: true,
            material: true
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return budgets;
  },

  // Buscar orçamentos por status
  async getBudgetsByStatus(status: BudgetStatus, professionalId: string) {
    const budgets = await prisma.budget.findMany({
      where: { 
        status, 
        userId: professionalId 
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true
          }
        },
        items: {
          include: {
            service: true,
            material: true
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return budgets;
  },

  async getBudgetStats(professionalId: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId: professionalId },
    include: {
      items: true,
      client: true
    }
  });

  const totalBudgets = budgets.length;
  const totalValue = budgets.reduce((sum, budget) => sum + (budget.totalValue || 0), 0);
  const averageValue = totalBudgets > 0 ? totalValue / totalBudgets : 0;
  
  const statusStats = {
    PENDING: budgets.filter(b => b.status === 'PENDING').length,
    APPROVED: budgets.filter(b => b.status === 'APPROVED').length,
    REJECTED: budgets.filter(b => b.status === 'REJECTED').length,
    EXPIRED: budgets.filter(b => b.status === 'EXPIRED').length
  };

  // Orçamentos dos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentBudgets = budgets.filter(b => 
    new Date(b.createdAt) >= thirtyDaysAgo
  ).length;

  // Clientes com mais orçamentos
  const clientStats = budgets.reduce((acc: any, budget) => {
    const clientId = budget.clientId;
    if (!acc[clientId]) {
      acc[clientId] = {
        clientId,
        clientName: budget.client?.fullName || 'Cliente',
        budgetCount: 0,
        totalValue: 0
      };
    }
    acc[clientId].budgetCount++;
    acc[clientId].totalValue += budget.totalValue || 0;
    return acc;
  }, {});

  const topClients = Object.values(clientStats)
    .sort((a: any, b: any) => b.budgetCount - a.budgetCount)
    .slice(0, 5);

  return {
    totalBudgets,
    totalValue,
    averageValue,
    statusStats,
    recentBudgets,
    topClients,
    monthlyGrowth: this.calculateMonthlyGrowth(budgets)
  };
},

// Calcular crescimento mensal
calculateMonthlyGrowth(budgets: any[]) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthBudgets = budgets.filter(b => {
    const date = new Date(b.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  const previousMonthBudgets = budgets.filter(b => {
    const date = new Date(b.createdAt);
    return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
  });

  const currentCount = currentMonthBudgets.length;
  const previousCount = previousMonthBudgets.length;
  
  if (previousCount === 0) return currentCount > 0 ? 100 : 0;
  
  return ((currentCount - previousCount) / previousCount) * 100;
},

  // Gerar resumo de orçamentos
  async getBudgetSummary(professionalId: string) {
    const budgets = await prisma.budget.findMany({
      where: { userId: professionalId },
      include: {
        items: true
      }
    });

    const totalBudgets = budgets.length;
    const totalValue = budgets.reduce((sum, budget) => sum + (budget.totalValue || 0), 0);
    
    const statusCount = {
      PENDING: budgets.filter(b => b.status === 'PENDING').length,
      APPROVED: budgets.filter(b => b.status === 'APPROVED').length,
      REJECTED: budgets.filter(b => b.status === 'REJECTED').length,
      EXPIRED: budgets.filter(b => b.status === 'EXPIRED').length
    };

    const recentBudgets = budgets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalBudgets,
      totalValue,
      statusCount,
      recentBudgets: recentBudgets.map(budget => ({
        id: budget.id,
        name: budget.name,
        status: budget.status,
        totalValue: budget.totalValue,
        createdAt: budget.createdAt
      }))
    };
  }
};