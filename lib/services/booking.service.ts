import {createServiceClient} from "@/lib/supabase/server"
import {logger} from "@/lib/logger"
import {activityLogService} from "./activity-log.service"

export interface CreateBookingParams {
  companyId: string
  professionalId: string
  serviceId: string
  slotId: string
  customerName: string
  customerEmail?: string | null
  customerPhone?: string | null
}

export class BookingService {
  async createBooking(params: CreateBookingParams) {
    const supabase = await createServiceClient()

    // Usar a função RPC create_booking_safely para garantir atomicidade
    const {data: bookingId, error} = await supabase.rpc("create_booking_safely", {
      p_company_id: params.companyId,
      p_professional_id: params.professionalId,
      p_service_id: params.serviceId,
      p_slot_id: params.slotId,
      p_customer_name: params.customerName,
      p_customer_email: params.customerEmail || null,
      p_customer_phone: params.customerPhone || null
    })

    if (error || !bookingId) {
      logger.error({
        message: "Failed to create booking",
        error,
        companyId: params.companyId,
        slotId: params.slotId
      })
      throw new Error(error?.message || "Failed to create booking")
    }

    // Buscar o booking criado
    const {data: booking, error: fetchError} = await supabase.from("bookings").select("*").eq("id", bookingId).single()

    if (fetchError || !booking) {
      logger.error({
        message: "Failed to fetch created booking",
        error: fetchError,
        bookingId
      })
      throw new Error("Failed to fetch created booking")
    }

    await activityLogService.log({
      companyId: params.companyId,
      action: "booking_created",
      resourceType: "booking",
      resourceId: booking.id,
      metadata: {
        professionalId: params.professionalId,
        serviceId: params.serviceId,
        slotId: params.slotId,
        customerName: params.customerName
      }
    })

    logger.info({
      message: "Booking created successfully",
      bookingId: booking.id,
      companyId: params.companyId
    })

    return booking
  }
}

export const bookingService = new BookingService()
