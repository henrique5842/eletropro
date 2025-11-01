export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return "Data inválida";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Data inválida";
  return date.toLocaleDateString("pt-BR");
};

export const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
    expired: "Expirado",

    PENDING: "Pendente",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
    EXPIRED: "Expirado",
  };
  return statusMap[status] || "Desconhecido";
};

export const getStatusColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    approved: "bg-green-500",
    rejected: "bg-red-500",
    expired: "bg-gray-500",

    PENDING: "bg-yellow-500",
    APPROVED: "bg-green-500",
    REJECTED: "bg-red-500",
    EXPIRED: "bg-gray-500",
  };
  return colorMap[status] || "bg-gray-500";
};

export const getStatusTextColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    pending: "text-yellow-400",
    approved: "text-green-400",
    rejected: "text-red-400",
    expired: "text-gray-400",
    PENDING: "text-yellow-400",
    APPROVED: "text-green-400",
    REJECTED: "text-red-400",
    EXPIRED: "text-gray-400",
  };
  return colorMap[status] || "text-gray-400";
};

export const getStatusIcon = (status: string): string => {
  const iconMap: { [key: string]: string } = {
    pending: "time-outline",
    approved: "checkmark-circle",
    rejected: "close-circle",
    expired: "alert-circle",
    PENDING: "time-outline",
    APPROVED: "checkmark-circle",
    REJECTED: "close-circle",
    EXPIRED: "alert-circle",
  };
  return iconMap[status] || "help-circle";
};

export const isQuoteExpired = (validUntil?: string): boolean => {
  if (!validUntil) return false;
  const validDate = new Date(validUntil);
  const now = new Date();
  return validDate < now;
};

export const getDaysUntilExpiration = (validUntil?: string): number | null => {
  if (!validUntil) return null;
  const validDate = new Date(validUntil);
  const now = new Date();
  const diffTime = validDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const formatValidityPeriod = (validUntil?: string): string => {
  if (!validUntil) return "";

  const daysLeft = getDaysUntilExpiration(validUntil);
  if (daysLeft === null) return "";

  if (daysLeft < 0) {
    return `Expirado há ${Math.abs(daysLeft)} dia(s)`;
  } else if (daysLeft === 0) {
    return "Expira hoje";
  } else if (daysLeft === 1) {
    return "Expira amanhã";
  } else {
    return `Expira em ${daysLeft} dia(s)`;
  }
};

export const formatItemsCount = (count: number): string => {
  if (count === 0) return "Nenhum item";
  if (count === 1) return "1 item";
  return `${count} itens`;
};
