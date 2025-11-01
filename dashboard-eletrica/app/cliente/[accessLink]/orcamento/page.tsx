"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PublicClientLayout } from "@/components/public-client-layout";
import { useClientData } from "@/hooks/use-client-data";
import { BudgetDetailsModal } from "@/components/budget-details-modal";
import { BudgetApprovalModal } from "@/components/budget-approval-modal";
import { BudgetPDFGenerator } from "@/lib/pdf-budget-generete";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils";
import {
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Hash,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Budget } from "@/types/client";

const companyInfo = {
  name: "RICARDO SOLUÇÕES ELÉTRICAS",
  phone: "(11) 98602-4724",
  whatsapp: "(11) 98602-4724",
  website: "https://www.ricardoeletricista.com.br/",
};

// Componente para exibir os itens do orçamento
function BudgetItems({ items }: { items: any[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        Nenhum item encontrado
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-semibold text-foreground mb-2">
        Itens do Orçamento:
      </h4>
      <div className="border rounded-md divide-y">
        {items.map((item, index) => (
          <div key={item.id || index} className="p-3 hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium text-sm">{item.description}</div>
                {item.details && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.details}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Quantidade: {item.quantity} {item.unit || "unidade(s)"}
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="font-semibold text-sm">
                  {formatCurrency(item.totalPrice)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(item.unitPrice)}/{item.unit || "un"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total:</span>
          <span className="text-lg font-bold text-primary">
            {formatCurrency(items.reduce((sum, item) => sum + (item.totalPrice || 0), 0))}
          </span>
        </div>
      </div>
    </div>
  );
}

function getDaysRemaining(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return 15 - diffDays;
}

function getExpirationDate(createdAt: string): Date {
  const created = new Date(createdAt);
  const expiration = new Date(created);
  expiration.setDate(expiration.getDate() + 15);
  return expiration;
}

function formatDateWithExpiration(createdAt: string): string {
  const created = new Date(createdAt);
  const expiration = getExpirationDate(createdAt);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return `${formatDate(created)} - ${formatDate(expiration)}`;
}

function isExpired(createdAt: string): boolean {
  return getDaysRemaining(createdAt) <= 0;
}

function isExpiringSoon(createdAt: string): boolean {
  const daysRemaining = getDaysRemaining(createdAt);
  return daysRemaining > 0 && daysRemaining <= 3;
}

export default function BudgetPage() {
  const params = useParams();
  const accessLink = params.accessLink as string;
  const { client, loading, error, refetch } = useClientData(accessLink);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [approvalBudget, setApprovalBudget] = useState<Budget | null>(null);
  const [approvalType, setApprovalType] = useState<"approve" | "reject">("approve");
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);

  const toggleExpanded = (budgetId: string) => {
    setExpandedBudgetId(expandedBudgetId === budgetId ? null : budgetId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-destructive mb-2">
                Erro ao carregar dados
              </h2>
              <p className="text-muted-foreground">
                {error || "Link de acesso inválido ou expirado"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApprovalSuccess = () => {
    setApprovalBudget(null);
    refetch();
  };

  return (
    <PublicClientLayout client={client} accessLink={accessLink}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Orçamentos
          </h1>
          <p className="text-muted-foreground">
            Visualize e gerencie seus orçamentos de serviços elétricos.
          </p>
        </div>

        {client.budgets.some(
          (b) => b.status === "PENDING" && isExpiringSoon(b.createdAt)
        ) && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Atenção!</strong> Você tem orçamentos próximos da
              expiração. Orçamentos não aprovados são automaticamente rejeitados
              após 15 dias.
            </AlertDescription>
          </Alert>
        )}

        {client.budgets.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhum orçamento encontrado
                </h3>
                <p className="text-sm text-muted-foreground">
                  Seus orçamentos aparecerão aqui quando forem criados pelo
                  profissional.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 mb-10">
            {client.budgets.map((budget) => {
              const daysRemaining = getDaysRemaining(budget.createdAt);
              const expired = isExpired(budget.createdAt);
              const expiringSoon = isExpiringSoon(budget.createdAt);
              const isPending = budget.status === "PENDING";
              const isExpanded = expandedBudgetId === budget.id;
              const itemCount = budget.items?.length || 0;

              return (
                <Card
                  key={budget.id}
                  className={`hover:shadow-md transition-shadow ${
                    isPending && expired
                      ? "border-red-300 bg-red-50"
                      : isPending && expiringSoon
                      ? "border-yellow-300 bg-yellow-50"
                      : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            {budget.name}
                          </h3>
                          {isPending && expired && (
                            <Badge
                              variant="destructive"
                              className="flex items-center gap-1"
                            >
                              <Clock className="h-3 w-3" />
                              EXPIRADO
                            </Badge>
                          )}
                          {isPending && expiringSoon && !expired && (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 border-yellow-500 text-yellow-700 bg-yellow-100"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              {daysRemaining}{" "}
                              {daysRemaining === 1 ? "dia" : "dias"} restante
                              {daysRemaining !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {isPending
                              ? formatDateWithExpiration(budget.createdAt)
                              : formatDate(budget.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(budget.totalValue)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Hash className="h-4 w-4" />
                            {itemCount} {itemCount === 1 ? "item" : "itens"}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(budget.status)}>
                        {getStatusLabel(budget.status)}
                      </Badge>
                    </div>

                    {isPending && expired && (
                      <Alert className="mb-4 border-red-300 bg-red-100">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800 text-sm">
                          Este orçamento expirou e será automaticamente
                          rejeitado pelo sistema.
                        </AlertDescription>
                      </Alert>
                    )}

                    {isPending && expiringSoon && !expired && (
                      <Alert className="mb-4 border-yellow-300 bg-yellow-100">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800 text-sm">
                          <strong>Urgente!</strong> Este orçamento expira em{" "}
                          {daysRemaining} {daysRemaining === 1 ? "dia" : "dias"}
                          . Aprove ou rejeite antes que seja automaticamente
                          rejeitado.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Botão para expandir/recolher itens */}
                    {budget.items && budget.items.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(budget.id)}
                        className="w-full mb-3 flex items-center justify-center gap-2"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Ocultar Itens
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Mostrar Itens ({itemCount})
                          </>
                        )}
                      </Button>
                    )}

                    {/* Lista de itens expandida */}
                    {isExpanded && budget.items && (
                      <BudgetItems items={budget.items} />
                    )}

                    <div className="flex items-center gap-2 flex-wrap mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBudget(budget)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Detalhes
                      </Button>

                      <BudgetPDFGenerator
                        budget={budget}
                        clientName={client.fullName}
                        companyInfo={companyInfo}
                      />

                      {isPending && !expired && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setApprovalBudget(budget);
                              setApprovalType("approve");
                            }}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Aprovar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setApprovalBudget(budget);
                              setApprovalType("reject");
                            }}
                            className="flex items-center gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                    </div>

                    {budget.signatures && budget.signatures.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          <strong>Assinado em:</strong>{" "}
                          {formatDate(
                            budget.signatures[0].signedAt ||
                              budget.signatures[0].createdAt
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {selectedBudget && (
          <BudgetDetailsModal
            budget={selectedBudget}
            open={!!selectedBudget}
            onClose={() => setSelectedBudget(null)}
          />
        )}

        {approvalBudget && (
          <BudgetApprovalModal
            budget={approvalBudget}
            accessLink={accessLink}
            type={approvalType}
            open={!!approvalBudget}
            onClose={() => setApprovalBudget(null)}
            onSuccess={handleApprovalSuccess}
          />
        )}
      </div>
    </PublicClientLayout>
  );
}