"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import { Package, Plus } from "lucide-react";
import { clientApi } from "@/lib/client-api";
import type { MaterialListPublicData, MaterialListItem } from "@/types/client";

interface MaterialListDetailsModalProps {
  accessLink: string;
  materialListId: string;
  open: boolean;
  onClose: () => void;
}

interface GroupedItem {
  id: string;
  material: {
    id: string;
    name: string;
    category: string;
    unit: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  isNew: boolean;
}

export function MaterialListDetailsModal({
  accessLink,
  materialListId,
  open,
  onClose,
}: MaterialListDetailsModalProps) {
  const [data, setData] = useState<MaterialListPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        const result = await clientApi.getMaterialListDetails(
          accessLink,
          materialListId
        );
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar detalhes"
        );
      } finally {
        setLoading(false);
      }
    }

    if (open && materialListId) {
      fetchDetails();
    }
  }, [accessLink, materialListId, open]);

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

  const isNewItem = (createdAt: string): boolean => {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    return new Date(createdAt) > twentyFourHoursAgo;
  };

  const groupItems = (items: MaterialListItem[]): GroupedItem[] => {
    const grouped = new Map<string, GroupedItem>();

    items.forEach((item) => {
      const key = item.material.id;

      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.quantity += item.quantity;
        existing.totalPrice = existing.unitPrice * existing.quantity;

        if (isNewItem(item.createdAt)) {
          existing.isNew = true;
        }
      } else {
        grouped.set(key, {
          id: item.id,
          material: item.material,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          createdAt: item.createdAt,
          isNew: isNewItem(item.createdAt),
        });
      }
    });

    return Array.from(grouped.values());
  };

  const groupedItems = data ? groupItems(data.items) : [];
  const newItems = groupedItems.filter((item) => item.isNew);
  const existingItems = groupedItems.filter((item) => !item.isNew);

  if (!open) return null;

  const renderItem = (item: GroupedItem, isNew: boolean = false) => (
    <div
      key={item.id}
      className={`border rounded-lg p-4 ${
        isNew ? "border-2 border-green-300 bg-green-50" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{item.material.name}</h4>
            {isNew && (
              <Badge className="bg-green-500 text-white text-xs">NOVO</Badge>
            )}
            {item.quantity > 1 && (
              <Badge variant="outline" className="text-xs">
                {item.quantity}x
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Categoria: {item.material.category}
          </div>
          <div className="text-sm text-muted-foreground">
            Unidade: {translateUnit(item.material.unit)}
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold">{formatCurrency(item.totalPrice)}</div>
          <div className="text-sm text-muted-foreground">
            {formatCurrency(item.unitPrice)} /{" "}
            {translateUnit(item.material.unit).toLowerCase()}
          </div>
        </div>
      </div>

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Quantidade: {item.quantity}</span>
        <span>Valor unitário: {formatCurrency(item.unitPrice)}</span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mt-8 mb-3">
            <DialogTitle className="flex items-center gap-2 ">
              <Package className="h-5 w-5" />
              {loading ? "Carregando..." : data?.name}
            </DialogTitle>
            {!loading && data && (
              <Badge className={getStatusColor(data.status)}>
                {getStatusLabel(data.status)}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        ) : error || !data ? (
          <div className="text-center py-8">
            <p className="text-destructive">
              {error || "Erro ao carregar detalhes"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Valor Total
                </div>
                <div className="text-xl font-bold text-primary">
                  {formatCurrency(data.totalValue)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Total de Itens
                </div>
                <div className="text-lg font-medium">{groupedItems.length}</div>
              </div>
            </div>

            {newItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-700">
                    Novos Itens Adicionados
                  </h3>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {newItems.length} novo(s)
                  </Badge>
                </div>
                <div className="space-y-3">
                  {newItems.map((item) => renderItem(item, true))}
                </div>
              </div>
            )}

            {existingItems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {newItems.length > 0
                    ? "Itens da Lista Original"
                    : "Itens da Lista de Materiais"}
                </h3>
                <div className="space-y-3">
                  {existingItems.map((item) => renderItem(item, false))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Geral:</span>
                <span className="text-primary">
                  {formatCurrency(data.totalValue)}
                </span>
              </div>
            </div>

            {data.signatures.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">
                      Assinado em:{" "}
                    </span>
                    <span>
                      {new Date(
                        data.signatures[0].signedAt ||
                          data.signatures[0].createdAt
                      ).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
