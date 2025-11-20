"use client"

import {useEffect, useState} from "react"
import dynamic from "next/dynamic"

// Importar Swagger UI apenas no cliente para evitar problemas de SSR
const SwaggerUI = dynamic(
  async () => {
    // Importar CSS e componente apenas no cliente
    if (typeof window !== "undefined") {
      await import("swagger-ui-react/swagger-ui.css")
    }
    const SwaggerUIBundle = await import("swagger-ui-react")
    return SwaggerUIBundle.default
  },
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando documentação...</p>
        </div>
      </div>
    )
  }
)

export default function ApiDocsPage() {
  const [openApiSpec, setOpenApiSpec] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Carregar o spec JSON no cliente
    fetch("/api/openapi-spec")
      .then((res) => res.json())
      .then((data) => setOpenApiSpec(data))
      .catch((err) => console.error("Error loading OpenAPI spec:", err))
  }, [])

  if (!mounted || !openApiSpec) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando documentação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">API de Agendamento v2 - Documentação</h1>
          <p className="text-muted-foreground">
            Documentação completa da API REST com exemplos de requisições e respostas
          </p>
        </div>
        <SwaggerUI spec={openApiSpec} />
      </div>
    </div>
  )
}
