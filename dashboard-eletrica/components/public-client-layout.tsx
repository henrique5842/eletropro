"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  User,
  FileText,
  Package,
  Wrench,
  PenTool,
  Zap,
  Menu,
  X,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";
import type { PublicClient } from "@/types/client";

const navigation = [
  { name: "Informações", href: "", icon: User },
  { name: "Orçamento", href: "/orcamento", icon: FileText },
  { name: "Materiais", href: "/materiais", icon: Package },
];

const PHONE_NUMBER = "5511986024724";

interface PublicClientLayoutProps {
  children: React.ReactNode;
  client: PublicClient;
  accessLink: string;
}

export function PublicClientLayout({
  children,
  client,
  accessLink,
}: PublicClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const getNavigationItems = () => {
    return navigation.map((item) => ({
      ...item,
      href: `/cliente/${accessLink}${item.href}`,
    }));
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${PHONE_NUMBER}`, "_blank");
    setSidebarOpen(false);
  };

  const handleCall = () => {
    window.location.href = `tel:+${PHONE_NUMBER}`;
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-4 lg:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xs font-semibold text-card-foreground">
                  RICARDO SOLUÇÕES ELÉTRICAS
                </h1>
                <p className="text-[10px] text-muted-foreground font-extrabold">
                  OLÁ SEJA BEM-VINDO(A),{" "}
                  {client.fullName.split(" ")[0].toUpperCase()}!
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      <div className="flex">
        <aside
          className={cn(
            "fixed inset-y-0 right-0 z-50 w-64 bg-sidebar border-l border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:left-0 lg:right-auto lg:border-r lg:border-l-0 h-screen",
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex flex-col h-full pt-20 lg:pt-6">
            <nav className="flex-1 px-4 space-y-2">
              {getNavigationItems().map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="px-4 pb-6 space-y-3 border-t border-sidebar-border pt-6 mb-14">
              <Button
                onClick={handleWhatsApp}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button onClick={handleCall} variant="outline" className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                Ligar
              </Button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0  bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 lg:ml-0">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
