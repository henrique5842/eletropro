"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, FileText, Package, Zap, Menu, X } from "lucide-react";

const navigation = [
  { name: "Informações", href: "/", icon: User },
  { name: "Orçamento", href: "/orcamento", icon: FileText },
  { name: "Materiais", href: "/materiais", icon: Package },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-4 lg:px-6">
          <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-card-foreground">
                  ElétricaPro
                </h1>
                <p className="text-xs text-muted-foreground">
                  Serviços Elétricos
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-card-foreground">
              João Silva
            </h2>
            <p className="text-sm text-muted-foreground">Cliente Premium</p>
          </div>

          <div className="w-32 lg:w-40"></div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full pt-20 lg:pt-6">
            <nav className="flex-1 px-4 space-y-2">
              {navigation.map((item) => {
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

            <div className="p-4 border-t border-sidebar-border">
              <Card className="p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Suporte
                </div>
                <div className="text-sm font-medium">(11) 9999-9999</div>
                <div className="text-xs text-muted-foreground">
                  contato@eletricapro.com
                </div>
              </Card>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
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
