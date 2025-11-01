"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { clientApi } from "@/lib/client-api";
import type { Budget } from "@/types/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface BudgetApprovalModalProps {
  budget: Budget;
  accessLink: string;
  type: "approve" | "reject";
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BudgetApprovalModal({
  budget,
  accessLink,
  type,
  open,
  onClose,
  onSuccess,
}: BudgetApprovalModalProps) {
  const [signature, setSignature] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (type === "approve" && !signature.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite seu nome completo para assinar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (type === "approve") {
        await clientApi.approveBudget(accessLink, budget.id, {
          signatureData: signature.trim(),
          signatureType: "BUDGET_ONLY",
        });
        toast({
          title: "Orçamento aprovado!",
          description: "Seu orçamento foi aprovado com sucesso.",
        });
      } else {
        await clientApi.rejectBudget(accessLink, budget.id, {
          rejectionReason: reason.trim() || "Motivo não informado",
        });
        toast({
          title: "Orçamento rejeitado",
          description: "Seu orçamento foi rejeitado.",
        });
      }

      onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description:
          "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSignature("");
      setReason("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "approve" ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Aprovar Orçamento
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Rejeitar Orçamento
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="font-medium">{budget.name}</div>
            <div className="text-sm text-muted-foreground">
              Valor: R${" "}
              {budget.totalValue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>

          {type === "approve" ? (
            <div className="space-y-2">
              <Label htmlFor="signature">Assinatura Digital *</Label>
              <Input
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Digite seu nome completo"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Ao digitar seu nome, você está assinando digitalmente este
                orçamento.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da rejeição (opcional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={3}
                disabled={loading}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`flex-1 ${
                type === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : type === "approve" ? (
                "Aprovar"
              ) : (
                "Rejeitar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
