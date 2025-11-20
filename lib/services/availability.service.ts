import {createServiceClient} from "@/lib/supabase/server"
import {logger} from "@/lib/logger"
import {activityLogService} from "./activity-log.service"

export interface CreateAvailabilityParams {
  professionalId: string
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // HH:mm format
  endTime: string // HH:mm format
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
}

export const availabilityService = new AvailabilityService()
