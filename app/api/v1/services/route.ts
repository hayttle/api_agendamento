import {NextRequest, NextResponse} from "next/server"
import {authenticateApiKey} from "@/lib/api-key/middleware"
import {serviceService} from "@/lib/services/service.service"
import {logger} from "@/lib/logger"
import {z} from "zod"
import type {ApiResponse} from "@/types/api"

const createServiceSchema = z.object({
  name: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  price: z.number().positive().optional().nullable()
})

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    logger.request({
      method: "GET",
      path: "/api/v1/services"
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
        path: "/api/v1/services",
        statusCode: 401,
        duration: Date.now() - startTime
      })
      return NextResponse.json(response, {status: 401})
    }

    const services = await serviceService.getAllServices(authResult.companyId)

    const response: ApiResponse = {
      success: true,
      data: services
    }

    logger.response({
      method: "GET",
      path: "/api/v1/services",
      statusCode: 200,
      duration: Date.now() - startTime,
      response: response,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    return NextResponse.json(response, {status: 200})
  } catch (error) {
    logger.error({
      message: "Error getting services",
      method: "GET",
      path: "/api/v1/services",
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

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    logger.request({
      method: "POST",
      path: "/api/v1/services"
    })

    const authResult = await authenticateApiKey(request)
    if (!authResult) {
      const response: ApiResponse = {
        success: false,
        error: "Unauthorized: Invalid or missing API key"
      }
      logger.warn({
        message: "Unauthorized request",
        method: "POST",
        path: "/api/v1/services",
        statusCode: 401,
        duration: Date.now() - startTime
      })
      return NextResponse.json(response, {status: 401})
    }

    const body = await request.json()
    logger.debug({
      message: "Request payload",
      method: "POST",
      path: "/api/v1/services",
      payload: body,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    const validated = createServiceSchema.parse(body)

    const service = await serviceService.createService({
      companyId: authResult.companyId,
      name: validated.name,
      durationMinutes: validated.durationMinutes,
      price: validated.price || null
    })

    const response: ApiResponse = {
      success: true,
      data: service
    }

    logger.response({
      method: "POST",
      path: "/api/v1/services",
      statusCode: 201,
      duration: Date.now() - startTime,
      response: response,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    return NextResponse.json(response, {status: 201})
  } catch (error) {
    logger.error({
      message: "Error creating service",
      method: "POST",
      path: "/api/v1/services",
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

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }
    return NextResponse.json(response, {status: 500})
  }
}
