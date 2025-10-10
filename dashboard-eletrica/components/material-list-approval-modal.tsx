"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientApi } from "@/lib/client-api";
import type { MaterialList } from "@/types/client";
import { Loader2 } from "lucide-react";

interface MaterialListApprovalModalProps {
  accessLink: string;
  materialListId: string;
  materialList?: MaterialList;
  type: "approve" | "reject";
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MaterialListApprovalModal({
  accessLink,
  materialListId,
  materialList,
  type,
  open,
  onClose,
  onSuccess,
}: MaterialListApprovalModalProps) {
  const [signature, setSignature] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (type === "approve" && !signature.trim()) {
      return;
    }

    setLoading(true);

    try {
      if (type === "approve") {
        await clientApi.approveMaterialList(accessLink, materialListId, {
          signatureData: signature.trim(),
          signatureType: "MATERIALS_ONLY",
        });
      } else {
        await clientApi.rejectMaterialList(accessLink, materialListId, {
          rejectionReason: reason.trim() || "Motivo não informado",
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Erro ao processar solicitação:", error);
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

  const isApproval = type === "approve";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isApproval
              ? "Aprovar Lista de Materiais"
              : "Rejeitar Lista de Materiais"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {materialList && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="font-semibold text-lg">{materialList.name}</div>
              <div className="text-sm text-muted-foreground">
                Valor:{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(materialList.totalValue)}
              </div>
            </div>
          )}

          {isApproval ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="signature" className="text-base font-semibold">
                  Assinatura Digital *
                </Label>
                <Input
                  id="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Digite seu nome completo"
                  required
                  disabled={loading}
                  className="h-12 text-base"
                />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ao digitar seu nome, você está assinando digitalmente esta
                  lista de materiais.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="reason" className="text-base font-semibold">
                Motivo da rejeição
              </Label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={4}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-12 bg-transparent border-2"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || (isApproval && !signature.trim())}
              className={`flex-1 h-12 ${
                isApproval
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isApproval ? (
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
