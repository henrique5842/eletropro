"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle,
  Download,
} from "lucide-react";

export function ClientInfo() {
  const handleDownloadInvoice = () => {
    console.log("[v0] Baixando nota fiscal...");
    alert("Download da nota fiscal iniciado!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Informações do Cliente
        </h1>
        <p className="text-muted-foreground">
          Seus dados pessoais e informações de contato
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nome Completo
              </label>
              <p className="text-lg font-semibold">João Silva Santos</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Telefone
              </label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">(11) 98765-4321</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                E-mail
              </label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">joao.silva@email.com</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Logradouro
              </label>
              <p className="font-medium">Rua das Flores, 123</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Bairro
                </label>
                <p className="font-medium">Centro</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  CEP
                </label>
                <p className="font-medium">01234-567</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Cidade
                </label>
                <p className="font-medium">São Paulo</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  UF
                </label>
                <p className="font-medium">SP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Preferências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Nota Fiscal Solicitada</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Você solicitou a emissão de nota fiscal para este serviço.
            </p>
            <Button
              onClick={handleDownloadInvoice}
              className="w-full mt-3 bg-transparent"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Nota Fiscal
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Cliente desde</span>
              <span className="text-muted-foreground">Janeiro 2024</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Projetos Concluídos</span>
              <span className="font-semibold text-primary">3</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
