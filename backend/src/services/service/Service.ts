import { prisma } from "../../lib/Prisma";

export interface CreateServiceData {
  name: string;
  description?: string;
  price: number;
  unit: "UNIT" | "METER";
  category?: string;
}

export interface UpdateServiceData extends Partial<CreateServiceData> {}

export interface ServiceStats {
  totalServices: number;
  servicesByCategory: { category: string; count: number }[];
  averagePrice: number;
  totalCategories: number;
}

export class ServiceService {
  static async createService(userId: string, serviceData: CreateServiceData) {
    const existingService = await prisma.service.findFirst({
      where: {
        userId,
        name: serviceData.name,
      },
    });

    if (existingService) {
      throw new Error("Já existe um serviço com este nome");
    }

    const service = await prisma.service.create({
      data: {
        ...serviceData,
        userId,
      },
    });

    return service;
  }

  static async getServices(
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
        { description: { contains: filters.search, mode: "insensitive" } },
        { category: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    return {
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getServiceById(userId: string, serviceId: string) {
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        userId,
      },
    });

    if (!service) {
      throw new Error("Serviço não encontrado");
    }

    return service;
  }

  static async updateService(
    userId: string,
    serviceId: string,
    serviceData: UpdateServiceData
  ) {
    const existingService = await prisma.service.findFirst({
      where: {
        id: serviceId,
        userId,
      },
    });

    if (!existingService) {
      throw new Error("Serviço não encontrado");
    }

    if (serviceData.name && serviceData.name !== existingService.name) {
      const serviceWithSameName = await prisma.service.findFirst({
        where: {
          userId,
          name: serviceData.name,
          id: { not: serviceId },
        },
      });

      if (serviceWithSameName) {
        throw new Error("Já existe um serviço com este nome");
      }
    }

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: serviceData,
    });

    return updatedService;
  }

  static async deleteService(userId: string, serviceId: string) {
    const existingService = await prisma.service.findFirst({
      where: {
        id: serviceId,
        userId,
      },
    });

    if (!existingService) {
      throw new Error("Serviço não encontrado");
    }

    await prisma.service.delete({
      where: { id: serviceId },
    });
  }

  static async getServiceStats(userId: string): Promise<ServiceStats> {
    const totalServices = await prisma.service.count({
      where: { userId },
    });

    const servicesByCategoryRaw = await prisma.service.groupBy({
      by: ["category"],
      where: { userId },
      _count: {
        id: true,
      },
    });

    const servicesByCategory = servicesByCategoryRaw
      .map((item) => ({
        category: item.category || "Sem categoria",
        count: item._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    const averagePriceResult = await prisma.service.aggregate({
      where: { userId },
      _avg: {
        price: true,
      },
    });

    const totalCategories = servicesByCategory.length;

    return {
      totalServices,
      servicesByCategory,
      averagePrice: averagePriceResult._avg.price || 0,
      totalCategories,
    };
  }

  static async getServiceCategories(userId: string): Promise<string[]> {
    const categories = await prisma.service.findMany({
      where: { userId },
      select: { category: true },
      distinct: ["category"],
    });

    const uniqueCategories = categories
      .map((item) => item.category)
      .filter((category): category is string => category !== null)
      .sort();

    if (uniqueCategories.length === 0) {
      return [
        "Instalação Elétrica",
        "Manutenção",
        "Projeto Elétrico",
        "Automação",
        "Iluminação",
        "SPDA",
        "Energia Solar",
        "Outros",
      ];
    }

    return uniqueCategories;
  }

  static async searchServices(
    userId: string,
    searchTerm: string
  ): Promise<any[]> {
    const services = await prisma.service.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
          { category: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: 20,
    });

    return services;
  }

  static async getServicesByCategory(
    userId: string,
    category: string
  ): Promise<any[]> {
    const where: any = { userId };

    if (category === "Sem categoria") {
      where.category = null;
    } else {
      where.category = category;
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return services;
  }

  static validateServiceData(serviceData: CreateServiceData): {
    isValid: boolean;
    error?: string;
  } {
    if (!serviceData.name || serviceData.name.trim().length < 2) {
      return {
        isValid: false,
        error: "Nome do serviço deve ter pelo menos 2 caracteres",
      };
    }

    if (!serviceData.price || serviceData.price <= 0) {
      return {
        isValid: false,
        error: "Preço deve ser maior que zero",
      };
    }

    if (!serviceData.unit) {
      return {
        isValid: false,
        error: "Unidade é obrigatória",
      };
    }

    const validUnits = ["UNIT", "METER"];
    if (!validUnits.includes(serviceData.unit)) {
      return {
        isValid: false,
        error: "Unidade inválida. Use apenas UNIT ou METER",
      };
    }

    return { isValid: true };
  }
}
