import {createServiceClient} from "@/lib/supabase/server"
import {logger} from "@/lib/logger"

export interface GetSlotsParams {
  professionalId: string
  serviceId?: string
  from: string // ISO date string
  to: string // ISO date string
  companyId: string
}

export interface Slot {
  id: string
  professional_id: string
  service_id: string | null
  start_time: string
  end_time: string
  is_available: boolean
}

export class SlotService {
  async getAvailableSlots(params: GetSlotsParams): Promise<Slot[]> {
    const supabase = await createServiceClient()

    // Verificar se o professional pertence à company
    const {data: professional} = await supabase
      .from("professionals")
      .select("id")
      .eq("id", params.professionalId)
      .eq("company_id", params.companyId)
      .single()

    if (!professional) {
      throw new Error("Professional not found or doesn't belong to company")
    }

    // Buscar slots disponíveis
    let query = supabase
      .from("slots")
      .select("*")
      .eq("professional_id", params.professionalId)
      .eq("is_available", true)
      .gte("start_time", params.from)
      .lte("start_time", params.to)
      .order("start_time", {ascending: true})

    if (params.serviceId) {
      query = query.or(`service_id.eq.${params.serviceId},service_id.is.null`)
    }

    const {data, error} = await query

    if (error) {
      logger.error({
        message: "Failed to get slots",
        error,
        professionalId: params.professionalId,
        companyId: params.companyId
      })
      throw new Error("Failed to get slots")
    }

    return data || []
  }
}

export const slotService = new SlotService()
