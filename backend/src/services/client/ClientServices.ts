import { prisma } from "../../lib/Prisma";

export interface CreateClientData {
  fullName: string;
  phone: string;
  email?: string;
  cpfCnpj?: string;
  requiresInvoice: boolean;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  totalValue?: number;
  isActive?: boolean;
}

export interface ClientStats {
  totalClients: number;
  totalValue: number;
  recentClients: number;
  activeClients: number;
  inactiveClients: number;
}

export interface ApprovalRequest {
  comments?: string;
  signature?: string;
}

export interface RejectionRequest {
  reason: string;
  comments?: string;
}

export class ClientService {
  static async createClient(userId: string, clientData: CreateClientData) {
    if (clientData.cpfCnpj) {
      const existingClient = await prisma.client.findFirst({
        where: {
          userId,
          cpfCnpj: clientData.cpfCnpj,
        },
      });

      if (existingClient) {
        throw new Error("Já existe um cliente com este CPF/CNPJ");
      }
    }

    if (clientData.email) {
      const existingClient = await prisma.client.findFirst({
        where: {
          userId,
          email: clientData.email,
        },
      });

      if (existingClient) {
        throw new Error("Já existe um cliente com este email");
      }
    }

    const publicLink = await this.generateUniquePublicLink();
    const accessCode = await this.generateUniqueAccessCode();

    const client = await prisma.client.create({
      data: {
        ...clientData,
        publicLink,
        accessCode,
        userId,
      },
      include: {
        budgets: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        materialLists: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return {
      ...client,
      publicUrl: `${process.env.FRONTEND_URL}/cliente/${publicLink}`,
    };
  }

  static async getClients(
    userId: string,
    filters?: {
      search?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
        { cpfCnpj: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: {
            select: {
              budgets: true,
              materialLists: true,
            },
          },
          budgets: {
            take: 3,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              status: true,
              totalValue: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return {
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getClientById(userId: string, clientId: string) {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
      include: {
        budgets: {
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: {
                service: true,
                material: true,
              },
            },
          },
        },
        materialLists: {
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        },
        _count: {
          select: {
            budgets: true,
            materialLists: true,
          },
        },
      },
    });

    if (!client) {
      throw new Error("Cliente não encontrado");
    }

    return client;
  }

  static async getClientByPublicLink(publicLink: string) {
    console.log("Buscando cliente no banco com publicLink:", publicLink);

    const client = await prisma.client.findFirst({
      where: {
        OR: [{ publicLink }, { accessCode: publicLink }],
        isActive: true,
      },
      include: {
        budgets: {
          where: { status: { in: ["PENDING", "APPROVED"] } },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            status: true,
            totalValue: true,
            createdAt: true,
            validUntil: true,
          },
        },
        materialLists: {
          where: { status: { in: ["PENDING", "APPROVED"] } },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            status: true,
            totalValue: true,
            createdAt: true,
          },
        },
      },
    });

    if (!client) {
      throw new Error("Cliente não encontrado ou link inválido");
    }

    return client;
  }

  static async approveBudgetPublic(
    accessLink: string,
    budgetId: string,
    data: ApprovalRequest
  ) {
    const client = await prisma.client.findFirst({
      where: {
        OR: [{ publicLink: accessLink }, { accessCode: accessLink }],
        isActive: true,
      },
    });

    if (!client) {
      throw new Error("Cliente não encontrado ou link inválido");
    }

    const budget = await prisma.budget.update({
      where: {
        id: budgetId,
        clientId: client.id,
      },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    return budget;
  }

  static async rejectBudgetPublic(
    accessLink: string,
    budgetId: string,
    data: RejectionRequest
  ) {
    const client = await prisma.client.findFirst({
      where: {
        OR: [{ publicLink: accessLink }, { accessCode: accessLink }],
        isActive: true,
      },
    });

    if (!client) {
      throw new Error("Cliente não encontrado ou link inválido");
    }

    const budget = await prisma.budget.update({
      where: {
        id: budgetId,
        clientId: client.id,
      },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectionReason: data.reason,
      },
    });

    return budget;
  }

  static async getMaterialListsPublic(accessLink: string) {
    const client = await prisma.client.findFirst({
      where: {
        OR: [{ publicLink: accessLink }, { accessCode: accessLink }],
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    if (!client) {
      throw new Error("Cliente não encontrado ou link inválido");
    }

    const materialLists = await prisma.materialList.findMany({
      where: {
        clientId: client.id,
        status: { in: ["PENDING", "APPROVED"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    return {
      client,
      materialLists,
    };
  }

  static async getMaterialListDetailsPublic(
    accessLink: string,
    materialListId: string
  ) {
    const client = await prisma.client.findFirst({
      where: {
        OR: [{ publicLink: accessLink }, { accessCode: accessLink }],
        isActive: true,
      },
    });

    if (!client) {
      throw new Error("Cliente não encontrado ou link inválido");
    }

    const materialList = await prisma.materialList.findFirst({
      where: {
        id: materialListId,
        clientId: client.id,
      },
      include: {
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    if (!materialList) {
      throw new Error("Lista de materiais não encontrada");
    }

    return materialList;
  }

  static async approveMaterialListPublic(
    accessLink: string,
    materialListId: string,
    data: ApprovalRequest
  ) {
    const client = await prisma.client.findFirst({
      where: {
        OR: [{ publicLink: accessLink }, { accessCode: accessLink }],
        isActive: true,
      },
    });

    if (!client) {
      throw new Error("Cliente não encontrado ou link inválido");
    }

    const materialList = await prisma.materialList.update({
      where: {
        id: materialListId,
        clientId: client.id,
      },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    return materialList;
  }

  static async rejectMaterialListPublic(
    accessLink: string,
    materialListId: string,
    data: RejectionRequest
  ) {
    const client = await prisma.client.findFirst({
      where: {
        OR: [{ publicLink: accessLink }, { accessCode: accessLink }],
        isActive: true,
      },
    });

    if (!client) {
      throw new Error("Cliente não encontrado ou link inválido");
    }

    const materialList = await prisma.materialList.update({
      where: {
        id: materialListId,
        clientId: client.id,
      },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectionReason: data.reason,
      },
    });

    return materialList;
  }

  static async updateClient(
    userId: string,
    clientId: string,
    clientData: UpdateClientData
  ) {
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    });

    if (!existingClient) {
      throw new Error("Cliente não encontrado");
    }

    if (clientData.cpfCnpj && clientData.cpfCnpj !== existingClient.cpfCnpj) {
      const clientWithSameDocument = await prisma.client.findFirst({
        where: {
          userId,
          cpfCnpj: clientData.cpfCnpj,
          id: { not: clientId },
        },
      });

      if (clientWithSameDocument) {
        throw new Error("Já existe um cliente com este CPF/CNPJ");
      }
    }

    if (clientData.email && clientData.email !== existingClient.email) {
      const clientWithSameEmail = await prisma.client.findFirst({
        where: {
          userId,
          email: clientData.email,
          id: { not: clientId },
        },
      });

      if (clientWithSameEmail) {
        throw new Error("Já existe um cliente com este email");
      }
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: clientData,
      include: {
        _count: {
          select: {
            budgets: true,
            materialLists: true,
          },
        },
      },
    });

    return updatedClient;
  }

  static async deleteClient(userId: string, clientId: string) {
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    });

    if (!existingClient) {
      throw new Error("Cliente não encontrado");
    }

    const relatedBudgets = await prisma.budget.count({
      where: { clientId },
    });

    const relatedMaterialLists = await prisma.materialList.count({
      where: { clientId },
    });

    if (relatedBudgets > 0 || relatedMaterialLists > 0) {
      throw new Error(
        "Não é possível excluir cliente com orçamentos ou listas de materiais vinculados. Desative o cliente instead."
      );
    }

    await prisma.client.delete({
      where: { id: clientId },
    });
  }

  static async deactivateClient(userId: string, clientId: string) {
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    });

    if (!existingClient) {
      throw new Error("Cliente não encontrado");
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: { isActive: false },
    });

    return updatedClient;
  }

  static async activateClient(userId: string, clientId: string) {
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    });

    if (!existingClient) {
      throw new Error("Cliente não encontrado");
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: { isActive: true },
    });

    return updatedClient;
  }

  static async getClientStats(userId: string): Promise<ClientStats> {
    const totalClients = await prisma.client.count({
      where: { userId },
    });

    const totalValueResult = await prisma.client.aggregate({
      where: { userId },
      _sum: { totalValue: true },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentClients = await prisma.client.count({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const activeClients = await prisma.client.count({
      where: {
        userId,
        isActive: true,
      },
    });

    const inactiveClients = await prisma.client.count({
      where: {
        userId,
        isActive: false,
      },
    });

    return {
      totalClients,
      totalValue: totalValueResult._sum.totalValue || 0,
      recentClients,
      activeClients,
      inactiveClients,
    };
  }

  static async regeneratePublicLink(userId: string, clientId: string) {
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    });

    if (!existingClient) {
      throw new Error("Cliente não encontrado");
    }

    const newPublicLink = await this.generateUniquePublicLink();
    const newAccessCode = await this.generateUniqueAccessCode();

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        publicLink: newPublicLink,
        accessCode: newAccessCode,
      },
    });

    return {
      ...updatedClient,
      publicUrl: `${process.env.FRONTEND_URL}/cliente/${newPublicLink}`,
    };
  }

  private static async generateUniquePublicLink(): Promise<string> {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let isUnique = false;
    let publicLink = "";

    while (!isUnique) {
      publicLink = "";
      for (let i = 0; i < 12; i++) {
        publicLink += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }

      const existingClient = await prisma.client.findUnique({
        where: { publicLink },
      });

      if (!existingClient) {
        isUnique = true;
      }
    }

    return publicLink;
  }

  private static async generateUniqueAccessCode(): Promise<string> {
    const characters = "0123456789";
    let isUnique = false;
    let accessCode = "";

    while (!isUnique) {
      accessCode = "";
      for (let i = 0; i < 6; i++) {
        accessCode += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }

      const existingClient = await prisma.client.findUnique({
        where: { accessCode },
      });

      if (!existingClient) {
        isUnique = true;
      }
    }

    return accessCode;
  }

  static validateClientData(clientData: CreateClientData): {
    isValid: boolean;
    error?: string;
  } {
    if (!clientData.fullName || clientData.fullName.trim().length < 2) {
      return {
        isValid: false,
        error: "Nome completo deve ter pelo menos 2 caracteres",
      };
    }

    if (!clientData.phone || clientData.phone.replace(/\D/g, "").length < 10) {
      return {
        isValid: false,
        error: "Telefone deve ter pelo menos 10 dígitos",
      };
    }

    if (clientData.email && !/\S+@\S+\.\S+/.test(clientData.email)) {
      return { isValid: false, error: "Email deve ter um formato válido" };
    }

    if (!clientData.cep || clientData.cep.replace(/\D/g, "").length !== 8) {
      return { isValid: false, error: "CEP deve ter 8 dígitos" };
    }

    if (!clientData.street || clientData.street.trim().length < 3) {
      return {
        isValid: false,
        error: "Endereço deve ter pelo menos 3 caracteres",
      };
    }

    if (!clientData.number || clientData.number.trim().length < 1) {
      return { isValid: false, error: "Número é obrigatório" };
    }

    if (!clientData.neighborhood || clientData.neighborhood.trim().length < 2) {
      return {
        isValid: false,
        error: "Bairro deve ter pelo menos 2 caracteres",
      };
    }

    if (!clientData.city || clientData.city.trim().length < 2) {
      return {
        isValid: false,
        error: "Cidade deve ter pelo menos 2 caracteres",
      };
    }

    if (!clientData.state || clientData.state.length !== 2) {
      return { isValid: false, error: "Estado deve ter 2 caracteres (UF)" };
    }

    return { isValid: true };
  }
}
