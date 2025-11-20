import {NextRequest, NextResponse} from "next/server"
import {authenticateApiKey} from "@/lib/api-key/middleware"
import {availabilityService} from "@/lib/services/availability.service"
import {logger} from "@/lib/logger"
import {z} from "zod"
import type {ApiResponse} from "@/types/api"

const createAvailabilitySchema = z.object({
  professionalId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    logger.request({
      method: "POST",
      path: "/api/v1/availabilities"
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
        path: "/api/v1/availabilities",
        statusCode: 401,
        duration: Date.now() - startTime
      })
      return NextResponse.json(response, {status: 401})
    }

    const body = await request.json()
    logger.debug({
      message: "Request payload",
      method: "POST",
      path: "/api/v1/availabilities",
      payload: body,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    const validated = createAvailabilitySchema.parse(body)

    // Verificar se o professional pertence à company
    const {createServiceClient} = await import("@/lib/supabase/server")
    const supabase = await createServiceClient()
    const {data: professional} = await supabase
      .from("professionals")
      .select("id")
      .eq("id", validated.professionalId)
      .eq("company_id", authResult.companyId)
      .single()

    if (!professional) {
      const response: ApiResponse = {
        success: false,
        error: "Professional not found or doesn't belong to your company"
      }
      return NextResponse.json(response, {status: 404})
    }

    const availability = await availabilityService.createAvailability({
      professionalId: validated.professionalId,
      dayOfWeek: validated.dayOfWeek,
      startTime: validated.startTime,
      endTime: validated.endTime
    })

    const response: ApiResponse = {
      success: true,
      data: availability
    }

    logger.response({
      method: "POST",
      path: "/api/v1/availabilities",
      statusCode: 201,
      duration: Date.now() - startTime,
      response: response,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    return NextResponse.json(response, {status: 201})
  } catch (error) {
    logger.error({
      message: "Error creating availability",
      method: "POST",
      path: "/api/v1/availabilities",
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
