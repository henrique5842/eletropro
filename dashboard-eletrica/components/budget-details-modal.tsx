"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Budget } from "@/types/client";
import { Tag } from "lucide-react";

interface BudgetDetailsModalProps {
  budget: Budget;
  open: boolean;
  onClose: () => void;
}

export function BudgetDetailsModal({
  budget,
  open,
  onClose,
}: BudgetDetailsModalProps) {
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

  const calculateDiscountData = () => {
    const items = budget.items || [];
    
    const subtotal = items.reduce((sum: number, item: any) => {
      const qty = parseFloat(String(item.quantity)) || 0;
      const price = parseFloat(String(item.unitPrice)) || 0;
      const total = parseFloat(String(item.totalPrice)) || 0;

      const itemTotal = total > 0 ? total : price * qty;
      return sum + itemTotal;
    }, 0);

    let discountValue = 0;
    const discountAmount = parseFloat(String(budget.discount)) || 0;

    if (discountAmount > 0) {
      if (budget.discountType === "PERCENTAGE") {
        discountValue = (subtotal * discountAmount) / 100;
      } else {
        discountValue = discountAmount;
      }
    }

    const totalWithDiscount = Math.max(0, subtotal - discountValue);
    const backendTotal = parseFloat(String(budget.totalValue)) || 0;

    return {
      subtotal,
      discountValue,
      total: backendTotal > 0 ? backendTotal : totalWithDiscount,
      hasDiscount: discountAmount > 0,
    };
  };

  const { subtotal, discountValue, total, hasDiscount } = calculateDiscountData();

  const items = budget.items || [];

  const renderItem = (item: any, index: number) => {
    const itemName = item.name || item.service?.name || item.material?.name || "Item sem nome";
    const itemDescription = item.description || "";
    const category = item.service?.category || item.material?.category;
    const unit = item.unit || item.service?.unit || item.material?.unit || "UNIT";
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const itemTotal = parseFloat(item.totalPrice) || (unitPrice * quantity);

    return (
      <div key={item.id || index} className="border rounded-lg p-4 bg-white">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{itemName}</h4>
              {quantity > 1 && (
                <Badge variant="outline" className="text-xs">
                  {quantity}x
                </Badge>
              )}
            </div>
            {itemDescription && (
              <div className="text-sm text-muted-foreground mb-1">
                {itemDescription}
              </div>
            )}
            {category && (
              <div className="text-sm text-muted-foreground">
                Categoria: {category}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              Unidade: {translateUnit(unit)}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {formatCurrency(itemTotal)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(unitPrice)} / {translateUnit(unit).toLowerCase()}
            </div>
          </div>
        </div>

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Quantidade: {quantity}</span>
          <span>Valor unitário: {formatCurrency(unitPrice)}</span>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mt-8 mb-3">
            <DialogTitle>{budget.name}</DialogTitle>
            <Badge className={getStatusColor(budget.status)}>
              {getStatusLabel(budget.status)}
            </Badge>
          </div>
          <DialogDescription>
            Detalhes completos do orçamento incluindo itens, valores e informações de pagamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Valor Total
              </div>
              <div className="text-xl font-bold text-primary">
                {formatCurrency(total)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Total de Itens
              </div>
              <div className="text-lg font-medium">
                {items.length}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Itens do Orçamento</h3>
            <div className="space-y-3">
              {items.length > 0 ? (
                items.map((item, index) => renderItem(item, index))
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  Nenhum item no orçamento
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="text-muted-foreground">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {hasDiscount && (
                <div className="flex justify-between items-center">
                  <span className="text-red-600 font-medium flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Desconto:
                  </span>
                  <span className="text-red-600 font-medium">
                    -{formatCurrency(discountValue)}
                    {budget.discountType === "PERCENTAGE" &&
                      ` (${budget.discount}%)`}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-lg font-semibold pt-2 border-t">
                <span>Total Final:</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {budget.signatures && budget.signatures.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted">
              <div className="text-sm">
                <span className="font-medium text-muted-foreground">
                  Assinado em:{" "}
                </span>
                <span>
                  {new Date(
                    budget.signatures[0].signedAt ||
                      budget.signatures[0].createdAt
                  ).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}