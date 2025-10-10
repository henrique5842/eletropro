export interface MaterialListItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  material: {
    id: string;
    name: string;
    category: string;
    unit: string;
    price: number;
  };
}

export interface MaterialList {
  id: string;
  name: string;
  totalValue: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  items: MaterialListItem[];
  signatures: Array<{
    signedAt: string;
    createdAt: string;
  }>;
  _count?: {
    items: number;
  };
}

export interface Professional {
  id: string;
  name: string;
  email: string;
  companyName: string;
  phone: string;
  professionalFullName: string;
  avatar?: string | null;
}

export interface PublicClient {
  id: string;
  fullName: string;
  professional: Professional;
  materialLists: MaterialList[];
}

export interface MaterialListDetails {
  client: {
    fullName: string;
    professional: Professional;
  };
  materialList: MaterialList;
}

export type SignatureType = "DIGITAL" | "MANUAL";

export interface ApprovalRequest {
  signatureData: string;
  signatureType: SignatureType;
}

export interface RejectionRequest {
  reason: string;
}
