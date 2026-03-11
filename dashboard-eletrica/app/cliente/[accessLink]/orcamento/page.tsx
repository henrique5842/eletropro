"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PublicClientLayout } from "@/components/public-client-layout"
import { useClientData } from "@/hooks/use-client-data"
import { BudgetDetailsModal } from "@/components/budget-details-modal"
import { BudgetApprovalModal } from "@/components/budget-approval-modal"
import { BudgetPDFGenerator } from "@/lib/pdf-budget-generete"
import { clientApi } from "@/lib/client-api"
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils"
import {
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Hash,
  Loader2,
  TrendingUp,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { Budget } from "@/types/client"

const companyInfo = {
  name: "RICARDO SOLUÇÕES ELÉTRICAS",
  phone: "(11) 98602-4724",
  whatsapp: "(11) 98602-4724",
  website: "https://www.ricardoeletricista.com.br/",
}

// Função para traduzir unidades
const translateUnit = (unit: string): string => {
  const unitTranslations: { [key: string]: string } = {
    UNIT: "Unidade",
    METER: "Metro",
    SQUARE_METER: "Metro Quadrado",
    LINEAR_METER: "Metro Linear",
    HOUR: "Hora",
    DAY: "Dia",
  }
  return unitTranslations[unit] || unit
}

function BudgetItems({ items, budget }: { items: any[]; budget: any }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-6 text-center bg-gradient-to-br from-accent/5 to-accent/10 rounded-lg border border-border/50">
        Nenhum item encontrado
      </div>
    )
  }

  const total = items.reduce((sum, item) => {
    const itemTotal =
      Number.parseFloat(item.totalPrice) || Number.parseFloat(item.unitPrice) * Number.parseFloat(item.quantity)
    return sum + itemTotal
  }, 0)

  return (
    <div className="mt-4 space-y-4">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        Itens do Orçamento ({items.length})
      </h4>

      <div className="border rounded-xl divide-y bg-card shadow-sm overflow-hidden">
        {items.map((item, index) => {
          const itemName = item.name || item.service?.name || item.material?.name || "Item sem nome"

          const itemDescription = item.description || ""

          const itemUnit = item.unit || item.service?.unit || item.material?.unit || "UNIT"

          const itemCategory = item.service?.category || item.material?.category

          const quantity = Number.parseFloat(item.quantity) || 0
          const unitPrice = Number.parseFloat(item.unitPrice) || 0
          const itemTotal = Number.parseFloat(item.totalPrice) || unitPrice * quantity

          return (
            <div key={item.id || index} className="p-4 hover:bg-accent/5 transition-colors duration-200">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground mb-2">{itemName}</div>

                  {itemDescription && <div className="text-xs text-muted-foreground mb-1.5">{itemDescription}</div>}

                  {itemCategory && (
                    <div className="text-xs text-muted-foreground mb-2 px-2 py-1 bg-muted/40 rounded-md w-fit">
                      {itemCategory}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span>
                      Qtd: <span className="font-semibold text-foreground">{quantity}</span>
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span>{translateUnit(itemUnit)}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-base text-primary">{formatCurrency(itemTotal)}</div>
                  <div className="text-xs text-muted-foreground mt-1">{formatCurrency(unitPrice)} / un.</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-2 bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg p-4 border border-border/50">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">Subtotal:</span>
          <span className="text-base font-semibold text-foreground">{formatCurrency(total)}</span>
        </div>

        {/* Calcula o desconto real pela diferença entre subtotal e total */}
        {(() => {
          const realDiscount = total - budget.totalValue
          
          if (realDiscount > 0) {
            const discountPercentage = ((realDiscount / total) * 100).toFixed(1)
            
            return (
              <>
                <div className="flex justify-between items-center pt-2 border-t border-border/30">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    Desconto
                    <Badge variant="secondary" className="text-xs">
                      {discountPercentage}%
                    </Badge>
                  </span>
                  <span className="text-base font-semibold text-emerald-600">-{formatCurrency(realDiscount)}</span>
                </div>
                
                {budget.discountReason && (
                  <div className="pt-2 border-t border-border/30">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Motivo:</span> {budget.discountReason}
                    </p>
                  </div>
                )}
              </>
            )
          }
          return null
        })()}

        <div className="flex justify-between items-center pt-3 border-t border-border/50">
          <span className="text-sm font-bold text-foreground">Total:</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(budget.totalValue)}</span>
        </div>
      </div>
    </div>
  )
}

function getDaysRemaining(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  const diffTime = now.getTime() - created.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return 15 - diffDays
}

function getExpirationDate(createdAt: string): Date {
  const created = new Date(createdAt)
  const expiration = new Date(created)
  expiration.setDate(expiration.getDate() + 15)
  return expiration
}

function formatDateWithExpiration(createdAt: string): string {
  const created = new Date(createdAt)
  const expiration = getExpirationDate(createdAt)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return `${formatDate(created)} - ${formatDate(expiration)}`
}

function isExpired(createdAt: string): boolean {
  return getDaysRemaining(createdAt) <= 0
}

function isExpiringSoon(createdAt: string): boolean {
  const daysRemaining = getDaysRemaining(createdAt)
  return daysRemaining > 0 && daysRemaining <= 3
}

export default function BudgetPage() {
  const params = useParams()
  const accessLink = params.accessLink as string
  const { client, loading, error, refetch } = useClientData(accessLink)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [approvalBudget, setApprovalBudget] = useState<Budget | null>(null)
  const [approvalType, setApprovalType] = useState<"approve" | "reject">("approve")
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null)

  const [budgetItems, setBudgetItems] = useState<Record<string, any[]>>({})
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({})

  const toggleExpanded = async (budgetId: string) => {
    const isCurrentlyExpanded = expandedBudgetId === budgetId

    if (isCurrentlyExpanded) {
      setExpandedBudgetId(null)
    } else {
      setExpandedBudgetId(budgetId)

      if (!budgetItems[budgetId]) {
        setLoadingItems((prev) => ({ ...prev, [budgetId]: true }))

        try {
          const budgetDetails = await clientApi.getBudgetDetails(accessLink, budgetId)

          console.log("Budget details loaded:", budgetDetails)

          setBudgetItems((prev) => ({
            ...prev,
            [budgetId]: budgetDetails.items || [],
          }))
        } catch (error) {
          console.error("Erro ao carregar itens do orçamento:", error)
          setBudgetItems((prev) => ({
            ...prev,
            [budgetId]: [],
          }))
        } finally {
          setLoadingItems((prev) => ({ ...prev, [budgetId]: false }))
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 shadow-lg">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <AlertTriangle className="h-12 w-12 text-destructive/80" />
              </div>
              <h2 className="text-lg font-semibold text-destructive mb-2">Erro ao carregar dados</h2>
              <p className="text-muted-foreground text-sm">{error || "Link de acesso inválido ou expirado"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleApprovalSuccess = () => {
    setApprovalBudget(null)
    refetch()
  }

  return (
    <PublicClientLayout client={client} accessLink={accessLink}>
      <div className="space-y-8 max-w-5xl">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-3xl font-bold text-foreground tracking-tight">Seus Orçamentos</h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Visualize, gerencie e aprove seus orçamentos de serviços elétricos. Aprove antes da expiração para não
            perder a validade.
          </p>
        </div>

        {client.budgets.some((b) => b.status === "PENDING" && isExpiringSoon(b.createdAt)) && (
          <Alert className="border-orange-500/50 bg-gradient-to-r from-orange-50 to-orange-50/50 shadow-sm">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <AlertDescription className="text-orange-900 text-sm font-medium">
              <strong>Atenção!</strong> Você tem orçamentos próximos da expiração. Aprove ou rejeite antes que sejam
              automaticamente rejeitados após 15 dias.
            </AlertDescription>
          </Alert>
        )}

        {client.budgets.length === 0 ? (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <FileText className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum orçamento encontrado</h3>
                <p className="text-muted-foreground text-sm">
                  Seus orçamentos aparecerão aqui quando forem criados pelo profissional.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 pb-10">
            {client.budgets.map((budget) => {
              const daysRemaining = getDaysRemaining(budget.createdAt)
              const expired = isExpired(budget.createdAt)
              const expiringSoon = isExpiringSoon(budget.createdAt)
              const isPending = budget.status === "PENDING"
              const isExpanded = expandedBudgetId === budget.id

              const items = budgetItems[budget.id] || budget.items || []
              const itemCount = items.length
              const isLoadingItems = loadingItems[budget.id] || false

              let borderStyle = "border-border/50"
              let bgStyle = "bg-card"

              if (isPending && expired) {
                borderStyle = "border-destructive/30"
                bgStyle = "bg-destructive/5"
              } else if (isPending && expiringSoon) {
                borderStyle = "border-orange-500/30"
                bgStyle = "bg-orange-50/50"
              }

              return (
                <Card
                  key={budget.id}
                  className={`${borderStyle} ${bgStyle} hover:shadow-md transition-all duration-300 border rounded-xl overflow-hidden`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-foreground truncate">{budget.name}</h3>
                          {isPending && expired && (
                            <Badge variant="destructive" className="flex items-center gap-1 whitespace-nowrap text-xs">
                              <Clock className="h-3 w-3" />
                              Expirado
                            </Badge>
                          )}
                          {isPending && expiringSoon && !expired && (
                            <Badge className="flex items-center gap-1 whitespace-nowrap text-xs bg-orange-500 hover:bg-orange-600 text-white">
                              <AlertTriangle className="h-3 w-3" />
                              {daysRemaining}d restante
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground/60" />
                            <span>
                              {isPending ? formatDateWithExpiration(budget.createdAt) : formatDate(budget.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground/60" />
                            <span className="font-semibold text-foreground">{formatCurrency(budget.totalValue)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-muted-foreground/60" />
                            <span>
                              {itemCount} {itemCount === 1 ? "item" : "itens"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Badge className={`${getStatusColor(budget.status)} whitespace-nowrap text-xs`}>
                        {getStatusLabel(budget.status)}
                      </Badge>
                    </div>

                    {isPending && expired && (
                      <Alert className="mb-4 border-destructive/30 bg-destructive/10 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-destructive/80" />
                        <AlertDescription className="text-destructive/90 text-sm">
                          Este orçamento expirou e será automaticamente rejeitado.
                        </AlertDescription>
                      </Alert>
                    )}

                    {isPending && expiringSoon && !expired && (
                      <Alert className="mb-4 border-orange-500/30 bg-orange-500/10 rounded-lg">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800 text-sm">
                          <strong>Urgente!</strong> Este orçamento expira em {daysRemaining}{" "}
                          {daysRemaining === 1 ? "dia" : "dias"}.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpanded(budget.id)}
                      className="w-full mb-4 justify-center gap-2 hover:bg-accent/10 transition-colors"
                      disabled={isLoadingItems}
                    >
                      {isLoadingItems ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Carregando itens...</span>
                        </>
                      ) : isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          <span>Ocultar Itens</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span>Mostrar Itens {itemCount > 0 && `(${itemCount})`}</span>
                        </>
                      )}
                    </Button>

                    {isExpanded && !isLoadingItems && <BudgetItems items={items} budget={budget} />}

                    <div className="flex items-center gap-2 flex-wrap mt-6 pt-4 border-t border-border/50">
                      <BudgetPDFGenerator budget={budget} clientName={client.fullName} companyInfo={companyInfo} />

                      {isPending && !expired && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setApprovalBudget(budget)
                              setApprovalType("approve")
                            }}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Aprovar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setApprovalBudget(budget)
                              setApprovalType("reject")
                            }}
                            className="flex items-center gap-2 border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                    </div>

                    {budget.signatures && budget.signatures.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Assinado em:</span>{" "}
                          {formatDate(budget.signatures[0].signedAt || budget.signatures[0].createdAt)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {selectedBudget && (
          <BudgetDetailsModal budget={selectedBudget} open={!!selectedBudget} onClose={() => setSelectedBudget(null)} />
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
  )
}