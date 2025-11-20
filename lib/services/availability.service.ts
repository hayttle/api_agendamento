import {createServiceClient} from "@/lib/supabase/server"
import {logger} from "@/lib/logger"
import {activityLogService} from "./activity-log.service"

export interface CreateAvailabilityParams {
  professionalId: string
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // HH:mm format
  endTime: string // HH:mm format
}

export interface UpdateAvailabilityParams {
  dayOfWeek?: number
  startTime?: string
  endTime?: string
}

export class AvailabilityService {
  async createAvailability(params: CreateAvailabilityParams) {
    const supabase = await createServiceClient()

    // Validar day_of_week
    if (params.dayOfWeek < 0 || params.dayOfWeek > 6) {
      throw new Error("dayOfWeek must be between 0 and 6")
    }

    const {data, error} = await supabase
      .from("availabilities")
      .insert({
        professional_id: params.professionalId,
        day_of_week: params.dayOfWeek,
        start_time: params.startTime,
        end_time: params.endTime
      })
      .select()
      .single()

    if (error || !data) {
      logger.error({
        message: "Failed to create availability",
        error,
        professionalId: params.professionalId
      })
      throw new Error("Failed to create availability")
    }

    await activityLogService.log({
      action: "availability_created",
      resourceType: "availability",
      resourceId: data.id,
      metadata: {
        professionalId: params.professionalId,
        dayOfWeek: params.dayOfWeek
      }
    })

    logger.info({
      message: "Availability created successfully",
      availabilityId: data.id,
      professionalId: params.professionalId
    })

    return data
  }

  async getAllAvailabilities(companyId: string, professionalId?: string) {
    const supabase = await createServiceClient()

    // Primeiro, buscar os professionals da company
    const {data: professionals, error: professionalsError} = await supabase
      .from("professionals")
      .select("id")
      .eq("company_id", companyId)

    if (professionalsError) {
      logger.error({
        message: "Failed to get professionals",
        error: professionalsError,
        companyId
      })
      throw new Error("Failed to get availabilities")
    }

    if (!professionals || professionals.length === 0) {
      return []
    }

    const professionalIds = professionals.map((p) => p.id)

    // Se professionalId foi especificado, verificar se pertence à company
    if (professionalId) {
      if (!professionalIds.includes(professionalId)) {
        throw new Error("Professional not found or doesn't belong to your company")
      }
    }

    // Buscar availabilities dos professionals da company
    let query = supabase
      .from("availabilities")
      .select("*")
      .in("professional_id", professionalId ? [professionalId] : professionalIds)

    const {data, error} = await query.order("day_of_week", {ascending: true}).order("start_time", {ascending: true})

    if (error) {
      logger.error({
        message: "Failed to get availabilities",
        error,
        companyId,
        professionalId
      })
      throw new Error("Failed to get availabilities")
    }

    return data || []
  }

  async getAvailabilityById(id: string, companyId: string) {
    const supabase = await createServiceClient()

    // Buscar a availability
    const {data: availability, error: availabilityError} = await supabase
      .from("availabilities")
      .select("*")
      .eq("id", id)
      .single()

    if (availabilityError || !availability) {
      logger.error({
        message: "Availability not found",
        error: availabilityError,
        availabilityId: id,
        companyId
      })
      throw new Error("Availability not found")
    }

    // Verificar se o professional pertence à company
    const {data: professional, error: professionalError} = await supabase
      .from("professionals")
      .select("id")
      .eq("id", availability.professional_id)
      .eq("company_id", companyId)
      .single()

    if (professionalError || !professional) {
      logger.error({
        message: "Availability not found (professional doesn't belong to company)",
        error: professionalError,
        availabilityId: id,
        companyId,
        professionalId: availability.professional_id
      })
      throw new Error("Availability not found")
    }

    return availability
  }

  async updateAvailability(id: string, companyId: string, params: UpdateAvailabilityParams) {
    const supabase = await createServiceClient()

    // Verificar se a availability existe e pertence à company
    await this.getAvailabilityById(id, companyId)

    // Validar day_of_week se fornecido
    if (params.dayOfWeek !== undefined && (params.dayOfWeek < 0 || params.dayOfWeek > 6)) {
      throw new Error("dayOfWeek must be between 0 and 6")
    }

    const updateData: any = {}
    if (params.dayOfWeek !== undefined) updateData.day_of_week = params.dayOfWeek
    if (params.startTime !== undefined) updateData.start_time = params.startTime
    if (params.endTime !== undefined) updateData.end_time = params.endTime

    const {data, error} = await supabase.from("availabilities").update(updateData).eq("id", id).select().single()

    if (error || !data) {
      logger.error({
        message: "Failed to update availability",
        error,
        availabilityId: id,
        companyId
      })
      throw new Error("Failed to update availability")
    }

    await activityLogService.log({
      action: "availability_updated",
      resourceType: "availability",
      resourceId: id,
      metadata: updateData
    })

    logger.info({
      message: "Availability updated successfully",
      availabilityId: id,
      companyId
    })

    return data
  }

  async deleteAvailability(id: string, companyId: string) {
    const supabase = await createServiceClient()

    // Verificar se a availability existe e pertence à company
    await this.getAvailabilityById(id, companyId)

    const {error} = await supabase.from("availabilities").delete().eq("id", id)

    if (error) {
      logger.error({
        message: "Failed to delete availability",
        error,
        availabilityId: id,
        companyId
      })
      throw new Error("Failed to delete availability")
    }

    await activityLogService.log({
      action: "availability_deleted",
      resourceType: "availability",
      resourceId: id
    })

    logger.info({
      message: "Availability deleted successfully",
      availabilityId: id,
      companyId
    })
  }
}

export const availabilityService = new AvailabilityService()
