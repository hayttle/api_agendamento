import {NextRequest, NextResponse} from "next/server"
import {authenticateApiKey} from "@/lib/api-key/middleware"
import {bookingService} from "@/lib/services/booking.service"
import {logger} from "@/lib/logger"
import {z} from "zod"
import type {ApiResponse} from "@/types/api"

const createBookingSchema = z.object({
  professionalId: z.string().uuid(),
  serviceId: z.string().uuid(),
  slotId: z.string().uuid(),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().optional().nullable()
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    logger.request({
      method: "POST",
      path: "/api/v1/bookings"
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
        path: "/api/v1/bookings",
        statusCode: 401,
        duration: Date.now() - startTime
      })
      return NextResponse.json(response, {status: 401})
    }

    const body = await request.json()
    logger.debug({
      message: "Request payload",
      method: "POST",
      path: "/api/v1/bookings",
      payload: body,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    const validated = createBookingSchema.parse(body)

    const booking = await bookingService.createBooking({
      companyId: authResult.companyId,
      professionalId: validated.professionalId,
      serviceId: validated.serviceId,
      slotId: validated.slotId,
      customerName: validated.customerName,
      customerEmail: validated.customerEmail || null,
      customerPhone: validated.customerPhone || null
    })

    const response: ApiResponse = {
      success: true,
      data: booking
    }

    logger.response({
      method: "POST",
      path: "/api/v1/bookings",
      statusCode: 201,
      duration: Date.now() - startTime,
      response: response,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    return NextResponse.json(response, {status: 201})
  } catch (error) {
    logger.error({
      message: "Error creating booking",
      method: "POST",
      path: "/api/v1/bookings",
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
