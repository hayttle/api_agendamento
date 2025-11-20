import {NextRequest, NextResponse} from "next/server"
import {requireAdmin} from "@/lib/auth/helpers"
import {apiKeyService} from "@/lib/services/api-key.service"
import {logger} from "@/lib/logger"
import type {ApiResponse} from "@/types/api"

export async function PATCH(request: NextRequest, {params}: {params: {id: string}}) {
  const startTime = Date.now()

  try {
    logger.request({
      method: "PATCH",
      path: `/api/v1/api-keys/${params.id}/revoke`
    })

    const user = await requireAdmin()

    if (!user.companyId) {
      const response: ApiResponse = {
        success: false,
        error: "User must be associated with a company"
      }
      return NextResponse.json(response, {status: 400})
    }

    await apiKeyService.revokeApiKey(params.id, user.companyId, user.id)

    const response: ApiResponse = {
      success: true,
      data: {message: "API key revoked successfully"}
    }

    logger.response({
      method: "PATCH",
      path: `/api/v1/api-keys/${params.id}/revoke`,
      statusCode: 200,
      duration: Date.now() - startTime,
      response: response,
      userId: user.id,
      companyId: user.companyId
    })

    return NextResponse.json(response)
  } catch (error) {
    logger.error({
      message: "Error revoking API key",
      method: "PATCH",
      path: `/api/v1/api-keys/${params.id}/revoke`,
      error,
      duration: Date.now() - startTime
    })

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }
    return NextResponse.json(response, {status: 500})
  }
}
