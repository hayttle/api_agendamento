import {createServiceClient} from "@/lib/supabase/server"
import {logger} from "@/lib/logger"
import {activityLogService} from "./activity-log.service"

export interface CreateServiceParams {
  companyId: string
  name: string
  durationMinutes: number
  price?: number | null
}

export interface UpdateServiceParams {
  name?: string
  durationMinutes?: number
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

  async getAllServices(companyId: string) {
    const supabase = await createServiceClient()

    const {data, error} = await supabase
      .from("services")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", {ascending: false})

    if (error) {
      logger.error({
        message: "Failed to get services",
        error,
        companyId
      })
      throw new Error("Failed to get services")
    }

    return data || []
  }

  async getServiceById(id: string, companyId: string) {
    const supabase = await createServiceClient()

    const {data, error} = await supabase.from("services").select("*").eq("id", id).eq("company_id", companyId).single()

    if (error || !data) {
      logger.error({
        message: "Service not found",
        error,
        serviceId: id,
        companyId
      })
      throw new Error("Service not found")
    }

    return data
  }

  async updateService(id: string, companyId: string, params: UpdateServiceParams) {
    const supabase = await createServiceClient()

    // Verificar se o service existe e pertence à company
    await this.getServiceById(id, companyId)

    const updateData: any = {}
    if (params.name !== undefined) updateData.name = params.name
    if (params.durationMinutes !== undefined) updateData.duration_minutes = params.durationMinutes
    if (params.price !== undefined) updateData.price = params.price

    const {data, error} = await supabase
      .from("services")
      .update(updateData)
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single()

    if (error || !data) {
      logger.error({
        message: "Failed to update service",
        error,
        serviceId: id,
        companyId
      })
      throw new Error("Failed to update service")
    }

    await activityLogService.log({
      companyId,
      action: "service_updated",
      resourceType: "service",
      resourceId: id,
      metadata: updateData
    })

    logger.info({
      message: "Service updated successfully",
      serviceId: id,
      companyId
    })

    return data
  }

  async deleteService(id: string, companyId: string) {
    const supabase = await createServiceClient()

    // Verificar se o service existe e pertence à company
    await this.getServiceById(id, companyId)

    const {error} = await supabase.from("services").delete().eq("id", id).eq("company_id", companyId)

    if (error) {
      logger.error({
        message: "Failed to delete service",
        error,
        serviceId: id,
        companyId
      })
      throw new Error("Failed to delete service")
    }

    await activityLogService.log({
      companyId,
      action: "service_deleted",
      resourceType: "service",
      resourceId: id
    })

    logger.info({
      message: "Service deleted successfully",
      serviceId: id,
      companyId
    })
  }
}

export const serviceService = new ServiceService()
