"use client"

import { useState, useEffect } from "react"
import type { PublicClient } from "@/types/client"
import { clientApi, ClientApiError } from "@/lib/client-api"

interface UseClientDataReturn {
  client: PublicClient | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useClientData(accessLink: string): UseClientDataReturn {
  const [client, setClient] = useState<PublicClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClient = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await clientApi.getPublicClient(accessLink)
      setClient(data)
    } catch (err) {
      if (err instanceof ClientApiError) {
        setError(err.message)
      } else {
        setError("Erro inesperado ao carregar dados")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (accessLink) {
      fetchClient()
    }
  }, [accessLink])

  return {
    client,
    loading,
    error,
    refetch: fetchClient,
  }
}
