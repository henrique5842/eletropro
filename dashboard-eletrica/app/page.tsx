import { AlertTriangle, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Acesso Restrito</CardTitle>
          <CardDescription className="text-slate-600">
            Esta área é restrita a clientes com link de acesso válido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-4 border border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Link de acesso necessário</p>
              <p className="text-amber-700">
                Você precisa de um link válido fornecido pelo profissional para acessar esta área.
              </p>
            </div>
          </div>

          <div className="text-center text-sm text-slate-500">
            <p>Se você é um cliente e possui um link de acesso,</p>
            <p>verifique se o endereço está correto.</p>
          </div>

          <div className="text-center text-xs text-slate-400 pt-4 border-t">
            <p>Formato esperado: /cliente/[seu-codigo-de-acesso]</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
