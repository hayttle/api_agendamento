import {NextRequest, NextResponse} from "next/server"
import {authenticateApiKey} from "@/lib/api-key/middleware"
import {availabilityService} from "@/lib/services/availability.service"
import {logger} from "@/lib/logger"
import {z} from "zod"
import type {ApiResponse} from "@/types/api"

const updateAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
})

export async function GET(request: NextRequest, {params}: {params: {id: string}}) {
  const startTime = Date.now()

  try {
    logger.request({
      method: "GET",
      path: `/api/v1/availabilities/${params.id}`
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
        path: `/api/v1/availabilities/${params.id}`,
        statusCode: 401,
        duration: Date.now() - startTime
      })
      return NextResponse.json(response, {status: 401})
    }

    const availability = await availabilityService.getAvailabilityById(params.id, authResult.companyId)

    const response: ApiResponse = {
      success: true,
      data: availability
    }

    logger.response({
      method: "GET",
      path: `/api/v1/availabilities/${params.id}`,
      statusCode: 200,
      duration: Date.now() - startTime,
      response: response,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    return NextResponse.json(response, {status: 200})
  } catch (error) {
    logger.error({
      message: "Error getting availability",
      method: "GET",
      path: `/api/v1/availabilities/${params.id}`,
      error,
      duration: Date.now() - startTime
    })

    if (error instanceof Error && error.message === "Availability not found") {
      const response: ApiResponse = {
        success: false,
        error: "Availability not found"
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
      path: `/api/v1/availabilities/${params.id}`
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
        path: `/api/v1/availabilities/${params.id}`,
        statusCode: 401,
        duration: Date.now() - startTime
      })
      return NextResponse.json(response, {status: 401})
    }

    const body = await request.json()
    logger.debug({
      message: "Request payload",
      method: "PUT",
      path: `/api/v1/availabilities/${params.id}`,
      payload: body,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    const validated = updateAvailabilitySchema.parse(body)

    const availability = await availabilityService.updateAvailability(params.id, authResult.companyId, validated)

    const response: ApiResponse = {
      success: true,
      data: availability
    }

    logger.response({
      method: "PUT",
      path: `/api/v1/availabilities/${params.id}`,
      statusCode: 200,
      duration: Date.now() - startTime,
      response: response,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    return NextResponse.json(response, {status: 200})
  } catch (error) {
    logger.error({
      message: "Error updating availability",
      method: "PUT",
      path: `/api/v1/availabilities/${params.id}`,
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

    if (error instanceof Error && error.message === "Availability not found") {
      const response: ApiResponse = {
        success: false,
        error: "Availability not found"
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
      path: `/api/v1/availabilities/${params.id}`
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
        path: `/api/v1/availabilities/${params.id}`,
        statusCode: 401,
        duration: Date.now() - startTime
      })
      return NextResponse.json(response, {status: 401})
    }

    await availabilityService.deleteAvailability(params.id, authResult.companyId)

    const response: ApiResponse = {
      success: true,
      data: {
        message: "Availability deleted successfully"
      }
    }

    logger.response({
      method: "DELETE",
      path: `/api/v1/availabilities/${params.id}`,
      statusCode: 200,
      duration: Date.now() - startTime,
      response: response,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    return NextResponse.json(response, {status: 200})
  } catch (error) {
    logger.error({
      message: "Error deleting availability",
      method: "DELETE",
      path: `/api/v1/availabilities/${params.id}`,
      error,
      duration: Date.now() - startTime
    })

    if (error instanceof Error && error.message === "Availability not found") {
      const response: ApiResponse = {
        success: false,
        error: "Availability not found"
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
