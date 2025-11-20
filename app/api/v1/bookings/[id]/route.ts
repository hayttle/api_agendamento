import {NextRequest, NextResponse} from "next/server"
import {authenticateApiKey} from "@/lib/api-key/middleware"
import {bookingService} from "@/lib/services/booking.service"
import {logger} from "@/lib/logger"
import {z} from "zod"
import type {ApiResponse} from "@/types/api"

const updateBookingSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional()
})

export async function GET(request: NextRequest, {params}: {params: {id: string}}) {
  const startTime = Date.now()

  try {
    logger.request({
      method: "GET",
      path: `/api/v1/bookings/${params.id}`
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
        path: `/api/v1/bookings/${params.id}`,
        statusCode: 401,
        duration: Date.now() - startTime
      })
      return NextResponse.json(response, {status: 401})
    }

    const booking = await bookingService.getBookingById(params.id, authResult.companyId)

    const response: ApiResponse = {
      success: true,
      data: booking
    }

    logger.response({
      method: "GET",
      path: `/api/v1/bookings/${params.id}`,
      statusCode: 200,
      duration: Date.now() - startTime,
      response: response,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    return NextResponse.json(response, {status: 200})
  } catch (error) {
    logger.error({
      message: "Error getting booking",
      method: "GET",
      path: `/api/v1/bookings/${params.id}`,
      error,
      duration: Date.now() - startTime
    })

    if (error instanceof Error && error.message === "Booking not found") {
      const response: ApiResponse = {
        success: false,
        error: "Booking not found"
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
      path: `/api/v1/bookings/${params.id}`
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
        path: `/api/v1/bookings/${params.id}`,
        statusCode: 401,
        duration: Date.now() - startTime
      })
      return NextResponse.json(response, {status: 401})
    }

    const body = await request.json()
    logger.debug({
      message: "Request payload",
      method: "PUT",
      path: `/api/v1/bookings/${params.id}`,
      payload: body,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    const validated = updateBookingSchema.parse(body)

    const booking = await bookingService.updateBooking(params.id, authResult.companyId, validated)

    const response: ApiResponse = {
      success: true,
      data: booking
    }

    logger.response({
      method: "PUT",
      path: `/api/v1/bookings/${params.id}`,
      statusCode: 200,
      duration: Date.now() - startTime,
      response: response,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    return NextResponse.json(response, {status: 200})
  } catch (error) {
    logger.error({
      message: "Error updating booking",
      method: "PUT",
      path: `/api/v1/bookings/${params.id}`,
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

    if (error instanceof Error && error.message === "Booking not found") {
      const response: ApiResponse = {
        success: false,
        error: "Booking not found"
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
      path: `/api/v1/bookings/${params.id}`
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
        path: `/api/v1/bookings/${params.id}`,
        statusCode: 401,
        duration: Date.now() - startTime
      })
      return NextResponse.json(response, {status: 401})
    }

    await bookingService.deleteBooking(params.id, authResult.companyId)

    const response: ApiResponse = {
      success: true,
      data: {
        message: "Booking deleted successfully"
      }
    }

    logger.response({
      method: "DELETE",
      path: `/api/v1/bookings/${params.id}`,
      statusCode: 200,
      duration: Date.now() - startTime,
      response: response,
      companyId: authResult.companyId,
      apiKeyId: authResult.apiKeyId
    })

    return NextResponse.json(response, {status: 200})
  } catch (error) {
    logger.error({
      message: "Error deleting booking",
      method: "DELETE",
      path: `/api/v1/bookings/${params.id}`,
      error,
      duration: Date.now() - startTime
    })

    if (error instanceof Error && error.message === "Booking not found") {
      const response: ApiResponse = {
        success: false,
        error: "Booking not found"
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
