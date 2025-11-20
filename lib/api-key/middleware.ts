import {NextRequest} from "next/server"
import {createServiceClient} from "@/lib/supabase/server"
import {extractApiClientId} from "./generator"
import {verifyApiKey} from "./hash"
import {logger} from "@/lib/logger"

export interface ApiKeyAuthResult {
  companyId: string
  apiKeyId: string
  apiClientId: string
}

/**
 * Middleware para autenticar requisições via API Key
 */
export async function authenticateApiKey(request: NextRequest): Promise<ApiKeyAuthResult | null> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn({
      message: "Missing or invalid Authorization header",
      method: request.method,
      path: request.nextUrl.pathname
    })
    return null
  }

  const apiKey = authHeader.slice(7) // Remove "Bearer "

  // Extrair apiClientId do prefixo
  const apiClientId = extractApiClientId(apiKey)
  if (!apiClientId) {
    logger.warn({
      message: "Invalid API key format",
      method: request.method,
      path: request.nextUrl.pathname
    })
    return null
  }

  const supabase = await createServiceClient()

  // Buscar api_client e api_key
  const {data: apiClient, error: clientError} = await supabase
    .from("api_clients")
    .select("id, company_id")
    .eq("id", apiClientId)
    .single()

  if (clientError || !apiClient) {
    logger.warn({
      message: "API client not found",
      method: request.method,
      path: request.nextUrl.pathname,
      apiClientId
    })
    return null
  }

  // Buscar todas as keys não revogadas deste client
  const {data: apiKeys, error: keysError} = await supabase
    .from("api_keys")
    .select("id, key_hash")
    .eq("api_client_id", apiClient.id)
    .eq("revoked", false)

  if (keysError || !apiKeys || apiKeys.length === 0) {
    logger.warn({
      message: "No valid API keys found for client",
      method: request.method,
      path: request.nextUrl.pathname,
      apiClientId: apiClient.id
    })
    return null
  }

  // Verificar hash de cada key
  for (const keyRecord of apiKeys) {
    const isValid = await verifyApiKey(apiKey, keyRecord.key_hash)

    if (isValid) {
      logger.info({
        message: "API key authenticated successfully",
        method: request.method,
        path: request.nextUrl.pathname,
        companyId: apiClient.company_id,
        apiKeyId: keyRecord.id,
        apiClientId: apiClient.id
      })

      return {
        companyId: apiClient.company_id,
        apiKeyId: keyRecord.id,
        apiClientId: apiClient.id
      }
    }
  }

  logger.warn({
    message: "API key verification failed",
    method: request.method,
    path: request.nextUrl.pathname,
    apiClientId: apiClient.id
  })

  return null
}
