"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import type { Budget } from "@/types/client";

interface BudgetPDFGeneratorProps {
  budget: Budget;
  clientName: string;
  companyInfo: {
    name: string;
    cnpj?: string;
    address?: string;
    city?: string;
    state?: string;
    cep?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    website?: string;
    logo?: string;
  };
}

export function BudgetPDFGenerator({
  budget,
  clientName,
  companyInfo,
}: BudgetPDFGeneratorProps) {
  const generatePDF = async () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 30;
    let yPosition = 0;

    const primaryColor = "#64B5F6";
    const secondaryColor = "#F3F4F6";
    const textColor = "#1F2937";
    const lightTextColor = "#6B7280";
    const whiteColor = "#FFFFFF";
    const borderColor = "#E5E7EB";

    const drawHeader = () => {
      yPosition = 40;

      if (companyInfo.logo) {
        try {
          const img = new Image();
          img.src = companyInfo.logo;

          doc.addImage(img, "PNG", margin, yPosition, 60, 60);
        } catch (error) {
          console.error("Erro ao adicionar o logo:", error);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(20);
          doc.setTextColor(primaryColor);
          doc.text(companyInfo.name, margin, yPosition + 20);
        }
      }

      const companyX = pageWidth - margin;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(textColor);
      doc.text(companyInfo.name, companyX, yPosition + 10, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(lightTextColor);

      doc.text(
        `Telefone: ${companyInfo.phone || "N/A"}`,
        companyX,
        yPosition + 32,
        { align: "right" }
      );

      doc.text(companyInfo.website || "", companyX, yPosition + 52, {
        align: "right",
      });

      yPosition += 90;
    };

    const drawTitle = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(textColor);
      doc.text("ORÇAMENTO", margin, yPosition);

      const createdDate = new Date(budget.createdAt);
      const validUntilDate = new Date(createdDate);
      validUntilDate.setDate(validUntilDate.getDate() + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(lightTextColor);
      doc.text(
        `Válido até: ${validUntilDate.toLocaleDateString("pt-BR")}`,
        pageWidth - margin,
        yPosition - 12,
        { align: "right" }
      );

      yPosition += 25;
    };

    const drawClientInfo = () => {
      doc.setFillColor(secondaryColor);
      doc.roundedRect(margin, yPosition, pageWidth - margin * 2, 50, 5, 5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(textColor);
      doc.text("PARA:", margin + 15, yPosition + 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(textColor);
      doc.text(
        clientName || "Cliente não informado",
        margin + 15,
        yPosition + 35
      );

      yPosition += 70;
    };

    const drawItemsTable = () => {
      const tableHeaders = [
        "DESCRIÇÃO DO SERVIÇO",
        "VALOR UNIT.",
        "QTD",
        "TOTAL",
      ];
      const tableX = margin;
      const tableWidth = pageWidth - margin * 2;
      const headerHeight = 25;

      const groupedItems = budget.items?.reduce((acc, item) => {
        const name =
          item.service?.name || item.material?.name || "Item não especificado";
        const unitPrice = Number(item.unitPrice) || 0;
        const quantity = Number(item.quantity) || 1;

        const key = `${name}-${unitPrice}`;

        if (!acc[key]) {
          acc[key] = {
            name,
            unitPrice,
            quantity: 0,
            totalPrice: 0,
          };
        }

        acc[key].quantity += quantity;
        acc[key].totalPrice += Number(item.totalPrice) || quantity * unitPrice;

        return acc;
      }, {} as Record<string, { name: string; unitPrice: number; quantity: number; totalPrice: number }>);

      const itemsArray = Object.values(groupedItems || {});

      doc.setFillColor(primaryColor);
      doc.roundedRect(tableX, yPosition, tableWidth, headerHeight, 3, 3, "F");
      doc.setTextColor(whiteColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);

      doc.text(tableHeaders[0], tableX + 10, yPosition + 16);
      doc.text(tableHeaders[1], tableX + tableWidth - 180, yPosition + 16, {
        align: "center",
      });
      doc.text(tableHeaders[2], tableX + tableWidth - 100, yPosition + 16, {
        align: "center",
      });
      doc.text(tableHeaders[3], tableX + tableWidth - 30, yPosition + 16, {
        align: "right",
      });

      yPosition += headerHeight;

      let subtotal = 0;
      const rowHeight = 30;

      itemsArray.forEach((item, index) => {
        subtotal += item.totalPrice;

        yPosition += rowHeight;
        doc.setTextColor(textColor);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        doc.text(item.name, tableX + 10, yPosition - 10);
        doc.text(
          `R$ ${item.unitPrice.toFixed(2).replace(".", ",")}`,
          tableX + tableWidth - 180,
          yPosition - 10,
          { align: "center" }
        );
        doc.text(
          `${item.quantity}`,
          tableX + tableWidth - 100,
          yPosition - 10,
          { align: "center" }
        );
        doc.setFont("helvetica", "bold");
        doc.text(
          `R$ ${item.totalPrice.toFixed(2).replace(".", ",")}`,
          tableX + tableWidth - 30,
          yPosition - 10,
          { align: "right" }
        );

        if (index < itemsArray.length - 1) {
          doc.setDrawColor(borderColor);
          doc.line(tableX, yPosition, tableX + tableWidth, yPosition);
        }
      });

      doc.setDrawColor(primaryColor);
      doc.setLineWidth(1.5);
      doc.line(tableX, yPosition + 5, tableX + tableWidth, yPosition + 5);

      yPosition += 30;
      return subtotal;
    };

    const drawTotals = (subtotal: number) => {
      const discountAmount = Number(budget.discount) || 0;
      let discountValue = 0;
      if (discountAmount > 0) {
        discountValue =
          budget.discountType === "PERCENTAGE"
            ? (subtotal * discountAmount) / 100
            : discountAmount;
      }
      const total = Number(budget.totalValue) || subtotal - discountValue;

      const totalsX = pageWidth - margin - 200;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(lightTextColor);
      doc.text("Subtotal:", totalsX, yPosition);
      doc.text(
        `R$ ${subtotal.toFixed(2).replace(".", ",")}`,
        pageWidth - margin,
        yPosition,
        { align: "right" }
      );
      yPosition += 20;

      if (discountValue > 0) {
        doc.setTextColor(lightTextColor);
        doc.text("Desconto:", totalsX, yPosition);
        const discountText =
          budget.discountType === "PERCENTAGE"
            ? `- R$ ${discountValue
                .toFixed(2)
                .replace(".", ",")} (${discountAmount}%)`
            : `- R$ ${discountValue.toFixed(2).replace(".", ",")}`;
        doc.setTextColor("#EF4444");
        doc.text(discountText, pageWidth - margin, yPosition, {
          align: "right",
        });
        yPosition += 20;
      }

      doc.setLineWidth(1);
      doc.setDrawColor(borderColor);
      doc.line(totalsX - 20, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(primaryColor);
      doc.text("VALOR TOTAL:", totalsX, yPosition);
      doc.text(
        `R$ ${total.toFixed(2).replace(".", ",")}`,
        pageWidth - margin,
        yPosition,
        { align: "right" }
      );

      yPosition += 40;
    };

    doc.addPage();
    doc.deletePage(1);

    drawHeader();
    drawTitle();
    const subtotal = drawItemsTable();
    drawTotals(subtotal);

    const fileName = `orcamento-${
      budget.name?.toLowerCase().replace(/\s+/g, "-") || budget.id
    }-${Date.now()}.pdf`;
    doc.save(fileName);
  };

  return (
    <Button
      onClick={generatePDF}
      variant="default"
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
    >
      <FileDown className="h-4 w-4" />
      Baixar Orçamentos
    </Button>
  );
}
