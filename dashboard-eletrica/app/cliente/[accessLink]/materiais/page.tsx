"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PublicClientLayout } from "@/components/public-client-layout";
import { useClientData } from "@/hooks/use-client-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Package,
  Eye,
  Calendar,
  DollarSign,
  Hash,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileDown,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { clientApi } from "@/lib/client-api";
import type { MaterialList } from "@/types/client";
import { MaterialListDetailsModal } from "@/components/material-list-details-modal";
import { MaterialListApprovalModal } from "@/components/material-list-approval-modal";
import { generateMaterialListPDF } from "@/lib/pdf-list-generete";

const companyInfo = {
  name: "RICARDO SOLUÇÕES ELÉTRICAS",
  phone: "(11) 98602-4724",
  whatsapp: "(11) 98602-4724",
  website: "https://www.ricardoeletricista.com.br/",
};

// Função para traduzir unidades
const translateUnit = (unit: string): string => {
  const unitTranslations: { [key: string]: string } = {
    UNIT: "Unidade",
    METER: "Metro",
    SQUARE_METER: "Metro Quadrado",
    LINEAR_METER: "Metro Linear",
    HOUR: "Hora",
    DAY: "Dia",
  };
  return unitTranslations[unit] || unit;
};

// Componente para exibir os itens da lista de materiais
function MaterialListItems({ items, materialList }: { items: any[]; materialList: any }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-6 text-center bg-gradient-to-br from-accent/5 to-accent/10 rounded-lg border border-border/50">
        Nenhum item encontrado
      </div>
    );
  }

  const total = items.reduce((sum, item) => {
    const itemTotal =
      Number.parseFloat(item.totalPrice) || Number.parseFloat(item.unitPrice) * Number.parseFloat(item.quantity);
    return sum + itemTotal;
  }, 0);

  return (
    <div className="mt-4 space-y-4">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        Itens da Lista ({items.length})
      </h4>

      <div className="border rounded-xl divide-y bg-card shadow-sm overflow-hidden">
        {items.map((item, index) => {
          const itemName = item.name || item.material?.name || "Item sem nome";
          const itemDescription = item.description || "";
          const itemUnit = item.unit || item.material?.unit || "UNIT";
          const itemCategory = item.material?.category;

          const quantity = Number.parseFloat(item.quantity) || 0;
          const unitPrice = Number.parseFloat(item.unitPrice) || 0;
          const itemTotal = Number.parseFloat(item.totalPrice) || unitPrice * quantity;

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
          );
        })}
      </div>

      <div className="space-y-2 bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg p-4 border border-border/50">
        <div className="flex justify-between items-center pt-3 border-t border-border/50">
          <span className="text-sm font-bold text-foreground">Total:</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(materialList.totalValue)}</span>
        </div>
      </div>
    </div>
  );
}

export default function MaterialsPage() {
  const params = useParams();
  const accessLink = params.accessLink as string;
  const { client, loading: clientLoading, error: clientError, refetch } = useClientData(accessLink);

  const [materialLists, setMaterialLists] = useState<MaterialList[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [listsError, setListsError] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<MaterialList | null>(null);
  const [approvalList, setApprovalList] = useState<MaterialList | null>(null);
  const [approvalType, setApprovalType] = useState<"approve" | "reject">("approve");
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  
  // Estados para carregar itens sob demanda
  const [listItems, setListItems] = useState<Record<string, any[]>>({});
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchMaterialLists() {
      try {
        setListsLoading(true);
        const data = await clientApi.getMaterialLists(accessLink);
        console.log("📦 Material Lists recebidas:", data.materialLists);
        setMaterialLists(data.materialLists);
      } catch (err) {
        console.error("❌ Erro ao carregar listas:", err);
        setListsError(err instanceof Error ? err.message : "Erro ao carregar listas de materiais");
      } finally {
        setListsLoading(false);
      }
    }

    if (accessLink) {
      fetchMaterialLists();
    }
  }, [accessLink]);

  const toggleExpanded = async (listId: string) => {
    const isCurrentlyExpanded = expandedListId === listId;

    if (isCurrentlyExpanded) {
      setExpandedListId(null);
    } else {
      setExpandedListId(listId);

      // Carrega os itens se ainda não foram carregados
      if (!listItems[listId]) {
        setLoadingItems((prev) => ({ ...prev, [listId]: true }));

        try {
          const listDetails = await clientApi.getMaterialListDetails(accessLink, listId);
          console.log("Material list details loaded:", listDetails);

          setListItems((prev) => ({
            ...prev,
            [listId]: listDetails.items || [],
          }));
        } catch (error) {
          console.error("Erro ao carregar itens da lista:", error);
          setListItems((prev) => ({
            ...prev,
            [listId]: [],
          }));
        } finally {
          setLoadingItems((prev) => ({ ...prev, [listId]: false }));
        }
      }
    }
  };

  const handleApprovalSuccess = () => {
    setApprovalList(null);
    clientApi.getMaterialLists(accessLink).then((data) => setMaterialLists(data.materialLists));
  };

  const handleGeneratePDF = async (list: MaterialList) => {
    setLoadingItems((prev) => ({ ...prev, [list.id]: true }));
    
    try {
      // Sempre busca os detalhes completos para o PDF
      const fullListData = await clientApi.getMaterialListDetails(accessLink, list.id);
      
      // Atualiza o cache também
      setListItems((prev) => ({
        ...prev,
        [list.id]: fullListData.items || [],
      }));

      // Gera o PDF com os dados completos da API (que incluem professional e client)
      generateMaterialListPDF(fullListData, client.fullName, companyInfo);
    } catch (error) {
      console.error("Erro ao carregar itens para PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setLoadingItems((prev) => ({ ...prev, [list.id]: false }));
    }
  };

  if (clientLoading || listsLoading) {
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
    );
  }

  if (clientError || listsError || !client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 shadow-lg">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <AlertTriangle className="h-12 w-12 text-destructive/80" />
              </div>
              <h2 className="text-lg font-semibold text-destructive mb-2">Erro ao carregar dados</h2>
              <p className="text-muted-foreground text-sm">
                {clientError || listsError || "Link de acesso inválido ou expirado"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PublicClientLayout client={client} accessLink={accessLink}>
      <div className="space-y-8 max-w-5xl">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-3xl font-bold text-foreground tracking-tight">Listas de Materiais</h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Visualize e gerencie suas listas de materiais dos projetos elétricos.
          </p>
        </div>

        {materialLists.length === 0 ? (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Package className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma lista encontrada</h3>
                <p className="text-muted-foreground text-sm">
                  As listas de materiais dos seus projetos aparecerão aqui quando forem criadas pelo profissional.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 pb-10">
            {materialLists.map((list: MaterialList) => {
              const isExpanded = expandedListId === list.id;
              const items = listItems[list.id] || list.items || [];
              const itemCount = items.length || list._count?.items || 0;
              const isLoadingItems = loadingItems[list.id] || false;

              return (
                <Card
                  key={list.id}
                  className="border-border/50 bg-card hover:shadow-md transition-all duration-300 border rounded-xl overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-foreground truncate">{list.name}</h3>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground/60" />
                            <span>{formatDate(list.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground/60" />
                            <span className="font-semibold text-foreground">{formatCurrency(list.totalValue)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-muted-foreground/60" />
                            <span>
                              {itemCount} {itemCount === 1 ? "item" : "itens"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpanded(list.id)}
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

                    {isExpanded && !isLoadingItems && <MaterialListItems items={items} materialList={list} />}

                    <div className="flex items-center gap-2 flex-wrap mt-6 pt-4 border-t border-border/50">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleGeneratePDF(list)}
                        disabled={isLoadingItems}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoadingItems ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          <>
                            <FileDown className="h-4 w-4" />
                            Baixar Lista
                          </>
                        )}
                      </Button>

               
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {selectedList && (
          <MaterialListDetailsModal
            accessLink={accessLink}
            materialListId={selectedList.id}
            open={!!selectedList}
            onClose={() => setSelectedList(null)}
          />
        )}

        {approvalList && (
          <MaterialListApprovalModal
            accessLink={accessLink}
            materialListId={approvalList.id}
            materialList={approvalList}
            type={approvalType}
            open={!!approvalList}
            onClose={() => setApprovalList(null)}
            onSuccess={handleApprovalSuccess}
          />
        )}
      </div>
    </PublicClientLayout>
  );
}