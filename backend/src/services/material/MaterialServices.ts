import { prisma } from "../../lib/Prisma";

export interface CreateMaterialData {
  name: string;
  category: string;
  price: number;
  unit: "UNIT" | "METER";
}

export interface UpdateMaterialData extends Partial<CreateMaterialData> {}

export interface MaterialsStats {
  totalMaterials: number;
  materialsWithUsage: number;
  totalUsageInBudgets: number;
  totalUsageInMaterialLists: number;
  materialsByCategory: { category: string; count: number }[];
  averagePrice: number;
}

export class MaterialService {
  static async createMaterial(
    userId: string,
    materialData: CreateMaterialData
  ) {
    const existingMaterial = await prisma.material.findFirst({
      where: {
        userId,
        name: materialData.name,
      },
    });

    if (existingMaterial) {
      throw new Error("Já existe um material com este nome");
    }

    const material = await prisma.material.create({
      data: {
        ...materialData,
        userId,
      },
    });

    return material;
  }

  static async getMaterials(
    userId: string,
    filters?: {
      search?: string;
      category?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { category: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        include: {
          _count: {
            select: {
              budgetItems: true,
              materialListItems: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.material.count({ where }),
    ]);

    return {
      materials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getMaterialById(userId: string, materialId: string) {
    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        userId,
      },
      include: {
        _count: {
          select: {
            budgetItems: true,
            materialListItems: true,
          },
        },
        budgetItems: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            budget: {
              select: {
                id: true,
                name: true,
                client: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
        materialListItems: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            materialList: {
              select: {
                id: true,
                name: true,
                client: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!material) {
      throw new Error("Material não encontrado");
    }

    return material;
  }

  static async updateMaterial(
    userId: string,
    materialId: string,
    materialData: UpdateMaterialData
  ) {
    const existingMaterial = await prisma.material.findFirst({
      where: {
        id: materialId,
        userId,
      },
    });

    if (!existingMaterial) {
      throw new Error("Material não encontrado");
    }

    if (materialData.name && materialData.name !== existingMaterial.name) {
      const materialWithSameName = await prisma.material.findFirst({
        where: {
          userId,
          name: materialData.name,
          id: { not: materialId },
        },
      });

      if (materialWithSameName) {
        throw new Error("Já existe um material com este nome");
      }
    }

    const updatedMaterial = await prisma.material.update({
      where: { id: materialId },
      data: materialData,
    });

    return updatedMaterial;
  }

  static async deleteMaterial(userId: string, materialId: string) {
    const existingMaterial = await prisma.material.findFirst({
      where: {
        id: materialId,
        userId,
      },
    });

    if (!existingMaterial) {
      throw new Error("Material não encontrado");
    }

    const relatedBudgetItems = await prisma.budgetItem.count({
      where: { materialId },
    });

    const relatedMaterialListItems = await prisma.materialListItem.count({
      where: { materialId },
    });

    if (relatedBudgetItems > 0 || relatedMaterialListItems > 0) {
      throw new Error(
        "Não é possível excluir material com orçamentos ou listas de materiais vinculados."
      );
    }

    await prisma.material.delete({
      where: { id: materialId },
    });
  }

  static async getMaterialStats(userId: string): Promise<MaterialsStats> {
    const totalMaterials = await prisma.material.count({
      where: { userId },
    });

    const materialsByCategoryRaw = await prisma.material.groupBy({
      by: ["category"],
      where: { userId },
      _count: {
        id: true,
      },
    });

    const materialsByCategory = materialsByCategoryRaw
      .map((item) => ({
        category: item.category,
        count: item._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    const averagePriceResult = await prisma.material.aggregate({
      where: { userId },
      _avg: {
        price: true,
      },
    });

    const materialsWithUsage = await prisma.material.count({
      where: {
        userId,
        OR: [
          { budgetItems: { some: {} } },
          { materialListItems: { some: {} } },
        ],
      },
    });

    const totalUsageInBudgets = await prisma.budgetItem.count({
      where: {
        material: { userId },
      },
    });

    const totalUsageInMaterialLists = await prisma.materialListItem.count({
      where: {
        material: { userId },
      },
    });

    return {
      totalMaterials,
      materialsWithUsage,
      totalUsageInBudgets,
      totalUsageInMaterialLists,
      materialsByCategory,
      averagePrice: averagePriceResult._avg.price || 0,
    };
  }

  static async getMaterialCategories(userId: string): Promise<string[]> {
    const categories = await prisma.material.findMany({
      where: { userId },
      select: { category: true },
      distinct: ["category"],
    });

    const uniqueCategories = categories.map((item) => item.category).sort();

    return uniqueCategories;
  }

  static async searchMaterials(
    userId: string,
    searchTerm: string
  ): Promise<any[]> {
    const materials = await prisma.material.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { category: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      include: {
        _count: {
          select: {
            budgetItems: true,
            materialListItems: true,
          },
        },
      },
      orderBy: { name: "asc" },
      take: 20,
    });

    return materials;
  }

  static async getMaterialsByCategory(
    userId: string,
    category: string
  ): Promise<any[]> {
    const materials = await prisma.material.findMany({
      where: {
        userId,
        category,
      },
      include: {
        _count: {
          select: {
            budgetItems: true,
            materialListItems: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return materials;
  }

  static validateMaterialData(materialData: CreateMaterialData): {
    isValid: boolean;
    error?: string;
  } {
    if (!materialData.name || materialData.name.trim().length < 2) {
      return {
        isValid: false,
        error: "Nome do material deve ter pelo menos 2 caracteres",
      };
    }

    if (!materialData.category || materialData.category.trim().length < 2) {
      return {
        isValid: false,
        error: "Categoria é obrigatória",
      };
    }

    if (!materialData.price || materialData.price <= 0) {
      return {
        isValid: false,
        error: "Preço deve ser maior que zero",
      };
    }

    if (!materialData.unit) {
      return {
        isValid: false,
        error: "Unidade é obrigatória",
      };
    }

    const validUnits = ["UNIT", "METER"];
    if (!validUnits.includes(materialData.unit)) {
      return {
        isValid: false,
        error: "Unidade inválida. Use apenas UNIT ou METER",
      };
    }

    return { isValid: true };
  }
}
