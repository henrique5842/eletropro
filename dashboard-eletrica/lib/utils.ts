import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString))
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "APPROVED":
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-200"
    case "REJECTED":
      return "bg-red-100 text-red-800 border-red-200"
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 border-blue-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pendente"
    case "APPROVED":
      return "Aprovado"
    case "REJECTED":
      return "Rejeitado"
    case "COMPLETED":
      return "Concluído"
    case "IN_PROGRESS":
      return "Em Andamento"
    default:
      return status
  }
}

