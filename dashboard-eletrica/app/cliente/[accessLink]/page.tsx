"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicClientLayout } from "@/components/public-client-layout";
import { useClientData } from "@/hooks/use-client-data";
import { formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import { User, FileText, TrendingUp, Clock, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientPage() {
  const params = useParams();
  const accessLink = params.accessLink as string;
  const { client, loading, error } = useClientData(accessLink);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
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

  const totalBudgets = client.budgets?.length || 0;
  const approvedBudgets =
    client.budgets?.filter((b) => b.status === "APPROVED").length || 0;
  const pendingBudgets =
    client.budgets?.filter((b) => b.status === "PENDING").length || 0;
  const totalValue =
    client.budgets?.reduce((sum, budget) => sum + budget.totalValue, 0) || 0;

  return (
    <PublicClientLayout client={client} accessLink={accessLink}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Olá, {client.fullName}!
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo à sua área do cliente. Aqui você pode acompanhar seus
            projetos e orçamentos.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Nome Completo
                </div>
                <div className="text-base">{client.fullName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Telefone
                </div>
                <div className="text-base">{client.phone}</div>
              </div>
              {client.email && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Email
                  </div>
                  <div className="text-base">{client.email}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {client.professional ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Profissional Responsável
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Nome
                  </div>
                  <div className="text-base font-medium">
                    {client.professional.name}
                  </div>
                </div>
                {client.professional.companyName && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Empresa
                    </div>
                    <div className="text-base">
                      {client.professional.companyName}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Email
                  </div>
                  <div className="text-base">{client.professional.email}</div>
                </div>
                {client.professional.phone && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Telefone
                    </div>
                    <div className="text-base">{client.professional.phone}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Profissional Responsável
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    ID do Profissional
                  </div>
                  <div className="text-base">{client.professionalId}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Para mais informações sobre o profissional responsável, entre
                  em contato diretamente.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumo de Orçamentos */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resumo de Orçamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {totalBudgets}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {approvedBudgets}
                  </div>
                  <div className="text-xs text-muted-foreground">Aprovados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {pendingBudgets}
                  </div>
                  <div className="text-xs text-muted-foreground">Pendentes</div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Valor Total
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
              </div>

              {pendingBudgets > 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Você tem {pendingBudgets} orçamento
                    {pendingBudgets > 1 ? "s" : ""} aguardando aprovação
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Orçamentos Recentes */}
        {client.budgets && client.budgets.length > 0 && (
          <Card className="mb-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Orçamentos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {client.budgets.slice(0, 3).map((budget) => (
                  <div
                    key={budget.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{budget.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(budget.totalValue)}
                      </div>
                    </div>
                    <Badge className={getStatusColor(budget.status)}>
                      {getStatusLabel(budget.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicClientLayout>
  );
}
