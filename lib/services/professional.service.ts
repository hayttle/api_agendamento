import {createServiceClient} from "@/lib/supabase/server"
import {logger} from "@/lib/logger"
import {activityLogService} from "./activity-log.service"

export interface CreateProfessionalParams {
  companyId: string
  name: string
  email?: string | null
  phone?: string | null
}

export class ProfessionalService {
  async createProfessional(params: CreateProfessionalParams) {
    const supabase = await createServiceClient()

    const {data, error} = await supabase
      .from("professionals")
      .insert({
        company_id: params.companyId,
        name: params.name,
        email: params.email || null,
        phone: params.phone || null
      })
      .select()
      .single()

    if (error || !data) {
      logger.error({
        message: "Failed to create professional",
        error,
        companyId: params.companyId
      })
      throw new Error("Failed to create professional")
    }

    await activityLogService.log({
      companyId: params.companyId,
      action: "professional_created",
      resourceType: "professional",
      resourceId: data.id,
      metadata: {
        name: params.name
      }
    })

    logger.info({
      message: "Professional created successfully",
      professionalId: data.id,
      companyId: params.companyId
    })

    return data
  }

  async getProfessionalById(id: string, companyId: string) {
    const supabase = await createServiceClient()

    const {data, error} = await supabase
      .from("professionals")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .single()

    if (error || !data) {
      logger.error({
        message: "Professional not found",
        error,
        professionalId: id,
        companyId
      })
      throw new Error("Professional not found")
    }

    return data
  }
}

export const professionalService = new ProfessionalService()
