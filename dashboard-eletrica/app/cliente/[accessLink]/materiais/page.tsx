"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PublicClientLayout } from "@/components/public-client-layout";
import { useClientData } from "@/hooks/use-client-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Package, Eye, Calendar, Hash, ChevronDown, ChevronUp } from "lucide-react";
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

// Componente para exibir os itens expandidos
function MaterialListItems({ items }: { items: any[] }) {
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
        Itens da Lista:
      </h4>
      <div className="border rounded-md divide-y">
        {items.map((item) => (
          <div key={item.id} className="p-3 hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium text-sm">{item.name}</div>
                {item.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Quantidade: {item.quantity} {item.unit === "METER" ? "metros" : "unidades"}
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="font-semibold text-sm">
                  {formatCurrency(item.totalPrice)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(item.unitPrice)}/{item.unit === "METER" ? "m" : "un"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MaterialsPage() {
  const params = useParams();
  const accessLink = params.accessLink as string;
  const {
    client,
    loading: clientLoading,
    error: clientError,
    refetch,
  } = useClientData(accessLink);

  const [materialLists, setMaterialLists] = useState<MaterialList[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [listsError, setListsError] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<MaterialList | null>(null);
  const [approvalList, setApprovalList] = useState<MaterialList | null>(null);
  const [approvalType, setApprovalType] = useState<"approve" | "reject">("approve");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMaterialLists() {
      try {
        setListsLoading(true);
        const data = await clientApi.getMaterialLists(accessLink);
        console.log('📦 Material Lists recebidas:', data.materialLists);
        setMaterialLists(data.materialLists);
      } catch (err) {
        console.error('❌ Erro ao carregar listas:', err);
        setListsError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar listas de materiais"
        );
      } finally {
        setListsLoading(false);
      }
    }

    if (accessLink) {
      fetchMaterialLists();
    }
  }, [accessLink]);

  const handleApprovalSuccess = () => {
    setApprovalList(null);
    clientApi
      .getMaterialLists(accessLink)
      .then((data) => setMaterialLists(data.materialLists));
  };

  const handleGeneratePDF = async (list: MaterialList) => {
    try {
      setPdfLoading(true);
      const fullListData = await clientApi.getMaterialListDetails(
        accessLink,
        list.id
      );
      generateMaterialListPDF(
        fullListData,
        (client as any).fullName || (client as any).name || "Cliente",
        companyInfo
      );
    } catch (err) {
      console.error("Erro ao carregar detalhes para PDF:", err);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setPdfLoading(false);
    }
  };

  const toggleExpanded = (listId: string) => {
    setExpandedListId(expandedListId === listId ? null : listId);
  };

  if (clientLoading || listsLoading) {
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

  if (clientError || listsError || !client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-destructive mb-2">
                Erro ao carregar dados
              </h2>
              <p className="text-muted-foreground">
                {clientError ||
                  listsError ||
                  "Link de acesso inválido ou expirado"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PublicClientLayout client={client} accessLink={accessLink}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Listas de Materiais
          </h1>
          <p className="text-muted-foreground">
            Visualize e aprove as listas de materiais dos seus projetos.
          </p>
        </div>

        {materialLists.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhuma lista encontrada
                </h3>
                <p className="text-sm text-muted-foreground">
                  As listas de materiais dos seus projetos aparecerão aqui
                  quando forem criadas.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 mb-10">
            {materialLists.map((list: MaterialList) => {
              const itemCount = list._count?.items || list.items?.length || 0;
              const isExpanded = expandedListId === list.id;
              
              return (
                <Card key={list.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">
                          {list.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(list.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Hash className="h-4 w-4" />
                            {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(list.totalValue)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Valor total da lista
                        </div>
                      </div>
                    </div>

                    {/* Botão para expandir/recolher itens */}
                    {list.items && list.items.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(list.id)}
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
                    {isExpanded && list.items && (
                      <MaterialListItems items={list.items} />
                    )}

                    <div className="flex items-center gap-2 flex-wrap mt-4">
                  

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGeneratePDF(list)}
                        disabled={pdfLoading}
                        className="flex items-center gap-2"
                      >
                        {pdfLoading ? "Gerando..." : "Baixar Lista de Materiais"}
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