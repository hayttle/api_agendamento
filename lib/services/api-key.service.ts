import {createServiceClient} from "@/lib/supabase/server"
import {generateApiKey} from "@/lib/api-key/generator"
import {hashApiKey} from "@/lib/api-key/hash"
import {logger} from "@/lib/logger"
import {activityLogService} from "./activity-log.service"

export interface CreateApiKeyParams {
  companyId: string
  label: string
  userId?: string
}

export interface ApiKeyResult {
  id: string
  fullKey: string
  label: string
  createdAt: string
}

export class ApiKeyService {
  /**
   * Cria uma nova API Key para uma company
   * Retorna o valor completo da key (apenas uma vez)
   */
  async createApiKey(params: CreateApiKeyParams): Promise<ApiKeyResult> {
    const supabase = await createServiceClient()

    // Criar api_client
    const {data: apiClient, error: clientError} = await supabase
      .from("api_clients")
      .insert({
        company_id: params.companyId,
        label: params.label
      })
      .select()
      .single()

    if (clientError || !apiClient) {
      logger.error({
        message: "Failed to create API client",
        error: clientError,
        companyId: params.companyId
      })
      throw new Error("Failed to create API client")
    }

    // Gerar API Key
    const generated = generateApiKey(apiClient.id)
    const keyHash = await hashApiKey(generated.fullKey)

    // Salvar hash no banco
    const {data: apiKey, error: keyError} = await supabase
      .from("api_keys")
      .insert({
        api_client_id: apiClient.id,
        key_hash: keyHash,
        key_prefix: generated.prefix,
        revoked: false
      })
      .select()
      .single()

    if (keyError || !apiKey) {
      logger.error({
        message: "Failed to create API key",
        error: keyError,
        apiClientId: apiClient.id
      })
      throw new Error("Failed to create API key")
    }

    // Log da atividade
    await activityLogService.log({
      companyId: params.companyId,
      userId: params.userId || null,
      action: "api_key_created",
      resourceType: "api_key",
      resourceId: apiKey.id,
      metadata: {
        apiClientId: apiClient.id,
        label: params.label
      }
    })

    logger.info({
      message: "API key created successfully",
      companyId: params.companyId,
      apiKeyId: apiKey.id,
      apiClientId: apiClient.id
    })

    return {
      id: apiKey.id,
      fullKey: generated.fullKey,
      label: apiClient.label,
      createdAt: apiKey.created_at
    }
  }

  /**
   * Lista todas as API Keys de uma company (sem mostrar o valor completo)
   */
  async listApiKeys(companyId: string) {
    const supabase = await createServiceClient()

    const {data, error} = await supabase
      .from("api_keys")
      .select(
        `
        id,
        key_prefix,
        revoked,
        created_at,
        revoked_at,
        api_clients!inner (
          id,
          label,
          company_id
        )
      `
      )
      .eq("api_clients.company_id", companyId)
      .order("created_at", {ascending: false})

    if (error) {
      logger.error({
        message: "Failed to list API keys",
        error,
        companyId
      })
      throw new Error("Failed to list API keys")
    }

    return data.map((key) => ({
      id: key.id,
      apiClientId: key.api_clients.id,
      label: key.api_clients.label,
      maskedKey: `${key.key_prefix}${key.api_clients.id}_****`,
      revoked: key.revoked,
      createdAt: key.created_at,
      revokedAt: key.revoked_at
    }))
  }

  /**
   * Revoga uma API Key
   */
  async revokeApiKey(apiKeyId: string, companyId: string, userId?: string): Promise<void> {
    const supabase = await createServiceClient()

    // Verificar se a key pertence à company
    const {data: apiKey, error: checkError} = await supabase
      .from("api_keys")
      .select(
        `
        id,
        api_clients!inner (
          company_id
        )
      `
      )
      .eq("id", apiKeyId)
      .eq("api_clients.company_id", companyId)
      .single()

    if (checkError || !apiKey) {
      logger.warn({
        message: "API key not found or doesn't belong to company",
        apiKeyId,
        companyId
      })
      throw new Error("API key not found")
    }

    // Revogar
    const {error: revokeError} = await supabase
      .from("api_keys")
      .update({
        revoked: true,
        revoked_at: new Date().toISOString()
      })
      .eq("id", apiKeyId)

    if (revokeError) {
      logger.error({
        message: "Failed to revoke API key",
        error: revokeError,
        apiKeyId
      })
      throw new Error("Failed to revoke API key")
    }

    // Log da atividade
    await activityLogService.log({
      companyId,
      userId: userId || null,
      action: "api_key_revoked",
      resourceType: "api_key",
      resourceId: apiKeyId
    })

    logger.info({
      message: "API key revoked successfully",
      apiKeyId,
      companyId
    })
  }
}

export const apiKeyService = new ApiKeyService()
