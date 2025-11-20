import {NextRequest, NextResponse} from "next/server"
import {authenticateApiKey} from "@/lib/api-key/middleware"
import {serviceService} from "@/lib/services/service.service"
import {logger} from "@/lib/logger"
import {z} from "zod"
import type {ApiResponse} from "@/types/api"

const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  durationMinutes: z.number().int().positive().optional(),
  price: z.number().positive().optional().nullable()
})

export async function GET(request: NextRequest, {params}: {params: {id: string}}) {
  const startTime = Date.now()

  try {
    logger.request({
      method: "GET",
      path: `/api/v1/services/${params.id}`
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
        path: `/api/v1/services/${params.id}`,
        statusCode: 401,
        duration: Date.now() - startTime
      })
      return NextResponse.json(response, {status: 401})
    }

    const service = await serviceService.getServiceById(params.id, authResult.companyId)

    const response: ApiResponse = {
      success: true,
      data: service
    }

    logger.response({
      method: "GET",
      path: `/api/v1/services/${params.id}`,
      statusCode: 200,
      duration: Date.now() - startTime,
      response: response,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    return NextResponse.json(response, {status: 200})
  } catch (error) {
    logger.error({
      message: "Error getting service",
      method: "GET",
      path: `/api/v1/services/${params.id}`,
      error,
      duration: Date.now() - startTime
    })

    if (error instanceof Error && error.message === "Service not found") {
      const response: ApiResponse = {
        success: false,
        error: "Service not found"
      }
      return NextResponse.json(response, {status: 404})
    }

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }
    return NextResponse.json(response, {status: 500})
  }
}

export async function PUT(request: NextRequest, {params}: {params: {id: string}}) {
  const startTime = Date.now()

  try {
    logger.request({
      method: "PUT",
      path: `/api/v1/services/${params.id}`
    })

    const authResult = await authenticateApiKey(request)
    if (!authResult) {
      const response: ApiResponse = {
        success: false,
        error: "Unauthorized: Invalid or missing API key"
      }
      logger.warn({
        message: "Unauthorized request",
        method: "PUT",
        path: `/api/v1/services/${params.id}`,
        statusCode: 401,
        duration: Date.now() - startTime
      })
      return NextResponse.json(response, {status: 401})
    }

    const body = await request.json()
    logger.debug({
      message: "Request payload",
      method: "PUT",
      path: `/api/v1/services/${params.id}`,
      payload: body,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    const validated = updateServiceSchema.parse(body)

    const service = await serviceService.updateService(params.id, authResult.companyId, validated)

    const response: ApiResponse = {
      success: true,
      data: service
    }

    logger.response({
      method: "PUT",
      path: `/api/v1/services/${params.id}`,
      statusCode: 200,
      duration: Date.now() - startTime,
      response: response,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    return NextResponse.json(response, {status: 200})
  } catch (error) {
    logger.error({
      message: "Error updating service",
      method: "PUT",
      path: `/api/v1/services/${params.id}`,
      error,
      duration: Date.now() - startTime
    })

    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: "Validation error",
        errors: error.flatten().fieldErrors
      }
      return NextResponse.json(response, {status: 400})
    }

    if (error instanceof Error && error.message === "Service not found") {
      const response: ApiResponse = {
        success: false,
        error: "Service not found"
      }
      return NextResponse.json(response, {status: 404})
    }

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }
    return NextResponse.json(response, {status: 500})
  }
}

export async function DELETE(request: NextRequest, {params}: {params: {id: string}}) {
  const startTime = Date.now()

  try {
    logger.request({
      method: "DELETE",
      path: `/api/v1/services/${params.id}`
    })

    const authResult = await authenticateApiKey(request)
    if (!authResult) {
      const response: ApiResponse = {
        success: false,
        error: "Unauthorized: Invalid or missing API key"
      }
      logger.warn({
        message: "Unauthorized request",
        method: "DELETE",
        path: `/api/v1/services/${params.id}`,
        statusCode: 401,
        duration: Date.now() - startTime
      })
      return NextResponse.json(response, {status: 401})
    }

    await serviceService.deleteService(params.id, authResult.companyId)

    const response: ApiResponse = {
      success: true,
      data: {
        message: "Service deleted successfully"
      }
    }

    logger.response({
      method: "DELETE",
      path: `/api/v1/services/${params.id}`,
      statusCode: 200,
      duration: Date.now() - startTime,
      response: response,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    return NextResponse.json(response, {status: 200})
  } catch (error) {
    logger.error({
      message: "Error deleting service",
      method: "DELETE",
      path: `/api/v1/services/${params.id}`,
      error,
      duration: Date.now() - startTime
    })

    if (error instanceof Error && error.message === "Service not found") {
      const response: ApiResponse = {
        success: false,
        error: "Service not found"
      }
      return NextResponse.json(response, {status: 404})
    }

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }
    return NextResponse.json(response, {status: 500})
  }
}
