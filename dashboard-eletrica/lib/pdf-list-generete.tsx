"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import type { MaterialListPublicData } from "@/types/client";

interface MaterialListPDFGeneratorProps {
  materialList: MaterialListPublicData;
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

export const generateMaterialListPDF = (
  materialList: MaterialListPublicData,
  clientName: string,
  companyInfo: any
) => {
  try {
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

      if (companyInfo.phone) {
        doc.text(`Telefone: ${companyInfo.phone}`, companyX, yPosition + 32, {
          align: "right",
        });
      }

      if (companyInfo.website) {
        doc.text(companyInfo.website, companyX, yPosition + 52, {
          align: "right",
        });
      }

      yPosition += 90;
    };

    const drawTitle = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(textColor);
      doc.text("LISTA DE MATERIAIS", margin, yPosition);

      const createdDate = new Date(materialList.createdAt);
      const validUntilDate = new Date(createdDate);
      validUntilDate.setDate(validUntilDate.getDate() + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(lightTextColor);
      doc.text(
        `Válida até: ${validUntilDate.toLocaleDateString("pt-BR")}`,
        pageWidth - margin,
        yPosition - 12,
        {
          align: "right",
        }
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

    const drawListInfo = () => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(lightTextColor);

      doc.text(
        `Nome da Lista: ${materialList.name || "N/A"}`,
        margin,
        yPosition
      );
      yPosition += 15;

      doc.text(
        `Data de Criação: ${new Date(materialList.createdAt).toLocaleDateString(
          "pt-BR"
        )}`,
        margin,
        yPosition
      );
      yPosition += 15;

      if ((materialList as any).description) {
        const descriptionLines = doc.splitTextToSize(
          (materialList as any).description,
          pageWidth - margin * 2
        );
        doc.text("Descrição:", margin, yPosition);
        yPosition += 12;
        doc.text(descriptionLines, margin, yPosition);
        yPosition += descriptionLines.length * 12 + 10;
      }

      yPosition += 10;
    };

    const drawItemsTable = () => {
      const tableHeaders = [
        "DESCRIÇÃO",
        "QTDE",
        "UNIDADE",
        "VLR. UNIT.",
        "TOTAL",
      ];
      const tableX = margin;
      const tableWidth = pageWidth - margin * 2;
      const headerHeight = 25;

      let itemsArray = Array.isArray(materialList.items)
        ? materialList.items
        : [];

      const groupedItems: Record<string, any> = {};
      itemsArray.forEach((item: any) => {
        const itemName =
          item.material?.name ||
          item.name ||
          item.description ||
          "Item sem nome";
        const unit = item.material?.unit || item.unit || "UN";
        const unitPrice = Number(
          item.material?.price || item.price || item.unitPrice || 0
        );

        const key = `${itemName}-${unit}-${unitPrice}`;

        if (!groupedItems[key]) {
          groupedItems[key] = {
            name: itemName,
            unit,
            unitPrice,
            quantity: 0,
            totalPrice: 0,
          };
        }

        const quantity = Number(item.quantity) || 1;
        groupedItems[key].quantity += quantity;
        groupedItems[key].totalPrice += quantity * unitPrice;
      });

      itemsArray = Object.values(groupedItems);

      doc.setFillColor(primaryColor);
      doc.roundedRect(tableX, yPosition, tableWidth, headerHeight, 3, 3, "F");
      doc.setTextColor(whiteColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);

      const colWidths = [140, 50, 60, 80, 80];
      let xPos = tableX + 5;

      tableHeaders.forEach((header, index) => {
        const align = index === 0 ? "left" : "center";
        doc.text(header, xPos, yPosition + 16, { align: align as any });
        xPos += colWidths[index];
      });

      yPosition += headerHeight;

      let subtotal = 0;
      const rowHeight = 25;

      itemsArray.forEach((item: any, index: number) => {
        const itemName = item.name;
        const quantity = item.quantity;
        const unit = item.unit;
        const unitPrice = item.unitPrice;
        const totalPrice = item.totalPrice;

        subtotal += totalPrice;

        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = margin;

          doc.setFillColor(primaryColor);
          doc.roundedRect(
            tableX,
            yPosition,
            tableWidth,
            headerHeight,
            3,
            3,
            "F"
          );
          doc.setTextColor(whiteColor);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);

          xPos = tableX + 5;
          tableHeaders.forEach((header, idx) => {
            const align = idx === 0 ? "left" : "center";
            doc.text(header, xPos, yPosition + 16, { align: align as any });
            xPos += colWidths[idx];
          });

          yPosition += headerHeight;
        }

        doc.setTextColor(textColor);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        const descriptionLines = doc.splitTextToSize(
          itemName,
          colWidths[0] - 5
        );
        const lineCount = descriptionLines.length;

        const currentYPos = yPosition + 12;

        xPos = tableX + 5;
        doc.text(descriptionLines, xPos, currentYPos, { align: "left" });
        xPos += colWidths[0];

        doc.text(`${quantity}`, xPos, currentYPos, { align: "center" });
        xPos += colWidths[1];

        doc.text(`${unit}`, xPos, currentYPos, { align: "center" });
        xPos += colWidths[2];

        doc.text(
          `R$ ${unitPrice.toFixed(2).replace(".", ",")}`,
          xPos,
          currentYPos,
          { align: "center" }
        );
        xPos += colWidths[3];

        doc.setFont("helvetica", "bold");
        doc.text(
          `R$ ${totalPrice.toFixed(2).replace(".", ",")}`,
          xPos,
          currentYPos,
          { align: "center" }
        );
        doc.setFont("helvetica", "normal");

        yPosition += Math.max(rowHeight, lineCount * 10);

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
      const total = Number(materialList.totalValue) || subtotal;

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

    const drawFooter = () => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(lightTextColor);

      const footerY = pageHeight - 20;

      doc.text(
        `Data de geração: ${new Date().toLocaleDateString(
          "pt-BR"
        )} às ${new Date().toLocaleTimeString("pt-BR")}`,
        pageWidth - margin,
        footerY,
        { align: "right" }
      );
    };

    doc.addPage();
    doc.deletePage(1);

    drawHeader();
    drawTitle();
    const subtotal = drawItemsTable();
    drawTotals(subtotal);
    drawFooter();

    const fileName = `lista-materiais-${
      materialList.name?.toLowerCase().replace(/\s+/g, "-") || materialList.id
    }-${Date.now()}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Erro ao gerar PDF. Tente novamente.");
  }
};

export function MaterialListPDFGenerator({
  materialList,
  clientName,
  companyInfo,
}: MaterialListPDFGeneratorProps) {
  const handleGeneratePDF = () => {
    generateMaterialListPDF(materialList, clientName, companyInfo);
  };

  return (
    <Button
      onClick={handleGeneratePDF}
      variant="default"
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
    >
      <FileDown className="h-4 w-4" />
      BAIXAR LISTA DE MATERIAIS
    </Button>
  );
}
