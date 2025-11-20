import {NextRequest, NextResponse} from "next/server"
import {authenticateApiKey} from "@/lib/api-key/middleware"
import {slotService} from "@/lib/services/slot.service"
import {logger} from "@/lib/logger"
import type {ApiResponse} from "@/types/api"

export async function GET(request: NextRequest, {params}: {params: {id: string}}) {
  const startTime = Date.now()

  try {
    logger.request({
      method: "GET",
      path: `/api/v1/professionals/${params.id}/slots`
    })

    const authResult = await authenticateApiKey(request)
    if (!authResult) {
      const response: ApiResponse = {
        success: false,
        error: "Unauthorized: Invalid or missing API key"
      }
      logger.warn({
        message: "Unauthorized request",
        method: "GET",
        path: `/api/v1/professionals/${params.id}/slots`,
        statusCode: 401,
        duration: Date.now() - startTime
      })
      return NextResponse.json(response, {status: 401})
    }

    const {searchParams} = new URL(request.url)
    const serviceId = searchParams.get("serviceId") || undefined
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    if (!from || !to) {
      const response: ApiResponse = {
        success: false,
        error: "Query parameters 'from' and 'to' are required (ISO date strings)"
      }
      return NextResponse.json(response, {status: 400})
    }

    logger.debug({
      message: "Request query params",
      method: "GET",
      path: `/api/v1/professionals/${params.id}/slots`,
      queryParams: {serviceId, from, to},
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    const slots = await slotService.getAvailableSlots({
      professionalId: params.id,
      serviceId,
      from,
      to,
      companyId: authResult.companyId
    })

    const response: ApiResponse = {
      success: true,
      data: slots
    }

    logger.response({
      method: "GET",
      path: `/api/v1/professionals/${params.id}/slots`,
      statusCode: 200,
      duration: Date.now() - startTime,
      response: response,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    return NextResponse.json(response)
  } catch (error) {
    logger.error({
      message: "Error getting slots",
      method: "GET",
      path: `/api/v1/professionals/${params.id}/slots`,
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
