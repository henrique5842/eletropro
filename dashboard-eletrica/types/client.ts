export interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
}

export interface MaterialListItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  materialId: string;
  materialListId: string;
  createdAt: string;
  updatedAt: string;
  material: Material;
}

export interface Professional {
  id: string;
  name: string;
  companyName: string;
  professionalFullName: string;
  avatar?: string;
  email: string;
  phone: string;
}

export interface Client {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface Signature {
  id: string;
  type: string;
  signedAt: string;
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  service?: {
    name: string;
    unit: string;
  };
  material?: {
    name: string;
    category: string;
  };
  createdAt?: string;
}

export interface Budget {
  id: string;
  name: string;
  totalValue: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  discount?: number;
  discountType?: "PERCENTAGE" | "FIXED";
  discountReason?: string;
  signatures: Signature[];
  items: BudgetItem[];
}

export interface MaterialListPublicData {
  id: string;
  name: string;
  totalValue: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  professionalId: string;
  budgetId?: string;
  accessLink?: string;
  items: MaterialListItem[];
  professional: Professional;
  client: Client;
  budget?: Budget;
  signatures: Signature[];
}

export interface MaterialList {
  id: string;
  name: string;
  totalValue: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  professionalId: string;
  budgetId?: string;
  accessLink?: string;
  items?: MaterialListItem[];
  _count?: {
    items: number;
  };
  signatures?: Signature[];
}

export interface PublicClient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  professionalId: string;
  accessLink: string;
  createdAt: string;
  updatedAt: string;
  budgets: Budget[];
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  professional?: Professional;
}

export interface ApprovalRequest {
  signatureData: string;
  signatureType?: string;
}

export interface RejectionRequest {
  rejectionReason: string;
}
