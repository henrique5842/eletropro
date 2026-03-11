import {
  PrismaClient,
  MaterialList,
  MaterialListItem,
  MaterialListStatus,
} from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

interface MaterialListFilters {
  clientId?: string;
  status?: MaterialListStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  budgetId?: string;
}

export const materialListService = {
  async createMaterialList(data: {
    name: string;
    clientId: string;
    userId: string;
    budgetId?: string;
    status?: MaterialListStatus;
    notes?: string;
  }): Promise<MaterialList> {
    return await prisma.$transaction(async (tx) => {
      const client = await tx.client.findFirst({
        where: {
          id: data.clientId,
          userId: data.userId,
        },
      });

      if (!client) {
        throw new Error("Cliente não encontrado");
      }

      if (data.budgetId) {
        const budget = await tx.budget.findFirst({
          where: {
            id: data.budgetId,
            userId: data.userId,
          },
        });

        if (!budget) {
          throw new Error("Orçamento não encontrado");
        }
      }

      const accessLink = uuidv4();

      const materialList = await tx.materialList.create({
        data: {
          name: data.name,
          clientId: data.clientId,
          userId: data.userId,
          budgetId: data.budgetId,
          status: data.status || "PENDING",
          notes: data.notes,
          accessLink,
          totalValue: 0,
        },
        include: {
          client: true,
          budget: true,
          items: {
            include: {
              material: true,
            },
          },
        },
      });

      return materialList;
    });
  },

  async listMaterialLists(
    professionalId: string,
    filters: MaterialListFilters = {}
  ) {
    const where: any = {
      userId: professionalId,
    };

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.budgetId) {
      where.budgetId = filters.budgetId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        {
          client: {
            fullName: { contains: filters.search, mode: "insensitive" },
          },
        },
        { notes: { contains: filters.search, mode: "insensitive" } },
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

    const materialLists = await prisma.materialList.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        budget: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            material: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return materialLists;
  },

  async getMaterialListById(id: string, professionalId: string) {
    const materialList = await prisma.materialList.findFirst({
      where: {
        id,
        userId: professionalId,
      },
      include: {
        client: true,
        budget: true,
        items: {
          include: {
            material: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!materialList) {
      throw new Error("Lista de materiais não encontrada");
    }

    return materialList;
  },

  async updateMaterialList(id: string, professionalId: string, data: any) {
    const materialList = await prisma.materialList.findFirst({
      where: {
        id,
        userId: professionalId,
      },
    });

    if (!materialList) {
      throw new Error("Lista de materiais não encontrada");
    }

    if (materialList.status !== "PENDING") {
      throw new Error("Só é possível editar listas de materiais pendentes");
    }

    if (data.budgetId) {
      const budget = await prisma.budget.findFirst({
        where: {
          id: data.budgetId,
          userId: professionalId,
        },
      });

      if (!budget) {
        throw new Error("Orçamento não encontrado");
      }
    }

    const updatedMaterialList = await prisma.materialList.update({
      where: { id },
      data: {
        name: data.name,
        budgetId: data.budgetId,
        notes: data.notes,
      },
      include: {
        client: true,
        budget: true,
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    return updatedMaterialList;
  },

  async updateMaterialListStatus(
    id: string,
    professionalId: string,
    status: MaterialListStatus
  ) {
    return await prisma.$transaction(async (tx) => {
      const materialList = await tx.materialList.findFirst({
        where: {
          id,
          userId: professionalId,
        },
      });

      if (!materialList) {
        throw new Error("Lista de materiais não encontrada");
      }

      const updateData: any = { status };

      if (status === "APPROVED") {
        updateData.approvedAt = new Date();
        updateData.rejectedAt = null;
        updateData.rejectionReason = null;
      } else if (status === "REJECTED") {
        updateData.rejectedAt = new Date();
        updateData.approvedAt = null;
      } else {
        updateData.approvedAt = null;
        updateData.rejectedAt = null;
        updateData.rejectionReason = null;
      }

      const updatedMaterialList = await tx.materialList.update({
        where: { id },
        data: updateData,
        include: {
          client: true,
          budget: true,
          items: {
            include: {
              material: true,
            },
          },
        },
      });

      return updatedMaterialList;
    });
  },

  async deleteMaterialList(id: string, professionalId: string) {
    const materialList = await prisma.materialList.findFirst({
      where: {
        id,
        userId: professionalId,
      },
    });

    if (!materialList) {
      throw new Error("Lista de materiais não encontrada");
    }

    await prisma.materialList.delete({
      where: { id },
    });
  },

  async addMaterialListItem(
    materialListId: string,
    professionalId: string,
    itemData: any
  ) {
    return await prisma.$transaction(async (tx) => {
      const materialList = await tx.materialList.findFirst({
        where: {
          id: materialListId,
          userId: professionalId,
        },
      });

      if (!materialList) {
        throw new Error("Lista de materiais não encontrada");
      }

      if (materialList.status !== "PENDING") {
        throw new Error(
          "Só é possível adicionar itens a listas de materiais pendentes"
        );
      }

      const material = await tx.material.findFirst({
        where: {
          id: itemData.materialId,
          userId: professionalId,
        },
      });

      if (!material) {
        throw new Error("Material não encontrado");
      }

      const totalPrice = itemData.quantity * itemData.unitPrice;

      const item = await tx.materialListItem.create({
        data: {
          name: itemData.name || material.name,
          description: itemData.description,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice || material.price,
          totalPrice,
          unit: itemData.unit || material.unit,
          materialListId,
          materialId: itemData.materialId,
        },
        include: {
          material: true,
        },
      });

      await this.recalculateMaterialListTotals(materialListId, tx);

      return item;
    });
  },

  async updateMaterialListItem(
    materialListId: string,
    itemId: string,
    professionalId: string,
    itemData: any
  ) {
    return await prisma.$transaction(async (tx) => {
      const materialList = await tx.materialList.findFirst({
        where: {
          id: materialListId,
          userId: professionalId,
        },
      });

      if (!materialList) {
        throw new Error("Lista de materiais não encontrada");
      }

      if (materialList.status !== "PENDING") {
        throw new Error(
          "Só é possível editar itens de listas de materiais pendentes"
        );
      }

      const item = await tx.materialListItem.findFirst({
        where: {
          id: itemId,
          materialListId,
        },
      });

      if (!item) {
        throw new Error("Item não encontrado");
      }

      const updateData: any = { ...itemData };

      if (itemData.quantity !== undefined || itemData.unitPrice !== undefined) {
        const quantity =
          itemData.quantity !== undefined ? itemData.quantity : item.quantity;
        const unitPrice =
          itemData.unitPrice !== undefined
            ? itemData.unitPrice
            : item.unitPrice;
        updateData.totalPrice = quantity * unitPrice;
      }

      const updatedItem = await tx.materialListItem.update({
        where: { id: itemId },
        data: updateData,
        include: {
          material: true,
        },
      });

      await this.recalculateMaterialListTotals(materialListId, tx);

      return updatedItem;
    });
  },

  async removeMaterialListItem(
    materialListId: string,
    itemId: string,
    professionalId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const materialList = await tx.materialList.findFirst({
        where: {
          id: materialListId,
          userId: professionalId,
        },
      });

      if (!materialList) {
        throw new Error("Lista de materiais não encontrada");
      }

      if (materialList.status !== "PENDING") {
        throw new Error(
          "Só é possível remover itens de listas de materiais pendentes"
        );
      }

      const item = await tx.materialListItem.findFirst({
        where: {
          id: itemId,
          materialListId,
        },
      });

      if (!item) {
        throw new Error("Item não encontrado");
      }

      await tx.materialListItem.delete({
        where: { id: itemId },
      });

      await this.recalculateMaterialListTotals(materialListId, tx);
    });
  },

  async recalculateMaterialListTotals(materialListId: string, tx: any) {
    const items = await tx.materialListItem.findMany({
      where: { materialListId },
    });

    const totalValue = items.reduce(
      (total: number, item: MaterialListItem) => total + item.totalPrice,
      0
    );

    await tx.materialList.update({
      where: { id: materialListId },
      data: {
        totalValue,
      },
    });
  },

  async duplicateMaterialList(
    originalMaterialListId: string,
    professionalId: string,
    newName: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const originalMaterialList = await tx.materialList.findFirst({
        where: {
          id: originalMaterialListId,
          userId: professionalId,
        },
        include: {
          items: true,
        },
      });

      if (!originalMaterialList) {
        throw new Error("Lista de materiais original não encontrada");
      }

      const newMaterialList = await tx.materialList.create({
        data: {
          name: newName,
          clientId: originalMaterialList.clientId,
          userId: professionalId,
          budgetId: originalMaterialList.budgetId,
          status: "PENDING",
          notes: originalMaterialList.notes,
          accessLink: uuidv4(),
          totalValue: 0,
        },
      });

      if (originalMaterialList.items.length > 0) {
        for (const item of originalMaterialList.items) {
          await tx.materialListItem.create({
            data: {
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              unit: item.unit,
              materialListId: newMaterialList.id,
              materialId: item.materialId,
            },
          });
        }
      }

      await this.recalculateMaterialListTotals(newMaterialList.id, tx);

      return await tx.materialList.findUnique({
        where: { id: newMaterialList.id },
        include: {
          client: true,
          budget: true,
          items: {
            include: {
              material: true,
            },
          },
        },
      });
    });
  },

  async getMaterialListsByClient(clientId: string, professionalId: string) {
    const materialLists = await prisma.materialList.findMany({
      where: {
        clientId,
        userId: professionalId,
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        budget: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            material: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return materialLists;
  },

  async getMaterialListsByBudget(budgetId: string, professionalId: string) {
    const materialLists = await prisma.materialList.findMany({
      where: {
        budgetId,
        userId: professionalId,
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        budget: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            material: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return materialLists;
  },

  async getMaterialListsByStatus(
    status: MaterialListStatus,
    professionalId: string
  ) {
    const materialLists = await prisma.materialList.findMany({
      where: {
        status,
        userId: professionalId,
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        budget: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            material: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return materialLists;
  },

  async getMaterialListSummary(professionalId: string) {
    const materialLists = await prisma.materialList.findMany({
      where: { userId: professionalId },
      include: {
        items: true,
        client: true,
      },
    });

    const totalMaterialLists = materialLists.length;
    const totalValue = materialLists.reduce(
      (sum, ml) => sum + (ml.totalValue || 0),
      0
    );

    const statusCount = {
      PENDING: materialLists.filter((ml) => ml.status === "PENDING").length,
      APPROVED: materialLists.filter((ml) => ml.status === "APPROVED").length,
      REJECTED: materialLists.filter((ml) => ml.status === "REJECTED").length,
      EXPIRED: materialLists.filter((ml) => ml.status === "EXPIRED").length,
    };

    const recentMaterialLists = materialLists
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);

    return {
      totalMaterialLists,
      totalValue,
      statusCount,
      recentMaterialLists: recentMaterialLists.map((ml) => ({
        id: ml.id,
        name: ml.name,
        status: ml.status,
        totalValue: ml.totalValue,
        createdAt: ml.createdAt,
      })),
    };
  },

  async getMaterialListStats(professionalId: string) {
    const materialLists = await prisma.materialList.findMany({
      where: { userId: professionalId },
      include: {
        items: {
          include: {
            material: true,
          },
        },
        client: true,
      },
    });

    const totalMaterialLists = materialLists.length;
    const totalValue = materialLists.reduce(
      (sum, ml) => sum + (ml.totalValue || 0),
      0
    );
    const averageValue =
      totalMaterialLists > 0 ? totalValue / totalMaterialLists : 0;

    const statusStats = {
      PENDING: materialLists.filter((ml) => ml.status === "PENDING").length,
      APPROVED: materialLists.filter((ml) => ml.status === "APPROVED").length,
      REJECTED: materialLists.filter((ml) => ml.status === "REJECTED").length,
      EXPIRED: materialLists.filter((ml) => ml.status === "EXPIRED").length,
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMaterialLists = materialLists.filter(
      (ml) => new Date(ml.createdAt) >= thirtyDaysAgo
    ).length;

    const clientStats = materialLists.reduce((acc: any, ml) => {
      const clientId = ml.clientId;
      if (!acc[clientId]) {
        acc[clientId] = {
          clientId,
          clientName: ml.client?.fullName || "Cliente",
          materialListCount: 0,
          totalValue: 0,
        };
      }
      acc[clientId].materialListCount++;
      acc[clientId].totalValue += ml.totalValue || 0;
      return acc;
    }, {});

    const topClients = Object.values(clientStats)
      .sort((a: any, b: any) => b.materialListCount - a.materialListCount)
      .slice(0, 5);

    const materialUsage = materialLists.reduce((acc: any, ml) => {
      ml.items.forEach((item) => {
        const materialId = item.materialId;
        if (!acc[materialId]) {
          acc[materialId] = {
            materialId,
            materialName: item.material?.name || "Material",
            usageCount: 0,
            totalQuantity: 0,
          };
        }
        acc[materialId].usageCount++;
        acc[materialId].totalQuantity += item.quantity;
      });
      return acc;
    }, {});

    const topMaterials = Object.values(materialUsage)
      .sort((a: any, b: any) => b.usageCount - a.usageCount)
      .slice(0, 5);

    return {
      totalMaterialLists,
      totalValue,
      averageValue,
      statusStats,
      recentMaterialLists,
      topClients,
      topMaterials,
      monthlyGrowth: this.calculateMonthlyGrowth(materialLists),
    };
  },

  calculateMonthlyGrowth(materialLists: any[]) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthLists = materialLists.filter((ml) => {
      const date = new Date(ml.createdAt);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const previousMonthLists = materialLists.filter((ml) => {
      const date = new Date(ml.createdAt);
      return (
        date.getMonth() === previousMonth && date.getFullYear() === previousYear
      );
    });

    const currentCount = currentMonthLists.length;
    const previousCount = previousMonthLists.length;

    if (previousCount === 0) return currentCount > 0 ? 100 : 0;

    return ((currentCount - previousCount) / previousCount) * 100;
  },

  async createMaterialListFromBudget(
    budgetId: string,
    professionalId: string,
    name: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const budget = await tx.budget.findFirst({
        where: {
          id: budgetId,
          userId: professionalId,
        },
        include: {
          items: {
            include: {
              material: true,
            },
          },
          client: true,
        },
      });

      if (!budget) {
        throw new Error("Orçamento não encontrado");
      }

      const materialList = await tx.materialList.create({
        data: {
          name: name || `Lista de Materiais - ${budget.name}`,
          clientId: budget.clientId,
          userId: professionalId,
          budgetId: budget.id,
          status: "PENDING",
          notes: `Criada a partir do orçamento: ${budget.name}`,
          accessLink: uuidv4(),
          totalValue: 0,
        },
      });

      const materialItems = budget.items.filter((item) => item.materialId);

      if (materialItems.length > 0) {
        for (const item of materialItems) {
          await tx.materialListItem.create({
            data: {
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              unit: item.unit,
              materialListId: materialList.id,
              materialId: item.materialId!,
            },
          });
        }
      }

      await this.recalculateMaterialListTotals(materialList.id, tx);

      return await tx.materialList.findUnique({
        where: { id: materialList.id },
        include: {
          client: true,
          budget: true,
          items: {
            include: {
              material: true,
            },
          },
        },
      });
    });
  },
};
