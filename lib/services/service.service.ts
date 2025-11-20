import {createServiceClient} from "@/lib/supabase/server"
import {logger} from "@/lib/logger"
import {activityLogService} from "./activity-log.service"

export interface CreateServiceParams {
  companyId: string
  name: string
  durationMinutes: number
  price?: number | null
}

export class ServiceService {
  async createService(params: CreateServiceParams) {
    const supabase = await createServiceClient()

    const {data, error} = await supabase
      .from("services")
      .insert({
        company_id: params.companyId,
        name: params.name,
        duration_minutes: params.durationMinutes,
        price: params.price || null
      })
      .select()
      .single()

    if (error || !data) {
      logger.error({
        message: "Failed to create service",
        error,
        companyId: params.companyId
      })
      throw new Error("Failed to create service")
    }

    await activityLogService.log({
      companyId: params.companyId,
      action: "service_created",
      resourceType: "service",
      resourceId: data.id,
      metadata: {
        name: params.name,
        durationMinutes: params.durationMinutes
      }
    })

    logger.info({
      message: "Service created successfully",
      serviceId: data.id,
      companyId: params.companyId
    })

    return data
  }
}

export const serviceService = new ServiceService()
