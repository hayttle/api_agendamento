import {createServiceClient} from "@/lib/supabase/server"
import {logger} from "@/lib/logger"
import {activityLogService} from "./activity-log.service"

export interface CreateProfessionalParams {
  companyId: string
  name: string
  email?: string | null
  phone?: string | null
}

export interface UpdateProfessionalParams {
  name?: string
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

  async getAllProfessionals(companyId: string) {
    const supabase = await createServiceClient()

    const {data, error} = await supabase
      .from("professionals")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", {ascending: false})

    if (error) {
      logger.error({
        message: "Failed to get professionals",
        error,
        companyId
      })
      throw new Error("Failed to get professionals")
    }

    return data || []
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

  async updateProfessional(id: string, companyId: string, params: UpdateProfessionalParams) {
    const supabase = await createServiceClient()

    // Verificar se o profissional existe e pertence à company
    await this.getProfessionalById(id, companyId)

    const updateData: any = {}
    if (params.name !== undefined) updateData.name = params.name
    if (params.email !== undefined) updateData.email = params.email
    if (params.phone !== undefined) updateData.phone = params.phone

    const {data, error} = await supabase
      .from("professionals")
      .update(updateData)
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single()

    if (error || !data) {
      logger.error({
        message: "Failed to update professional",
        error,
        professionalId: id,
        companyId
      })
      throw new Error("Failed to update professional")
    }

    await activityLogService.log({
      companyId,
      action: "professional_updated",
      resourceType: "professional",
      resourceId: id,
      metadata: updateData
    })

    logger.info({
      message: "Professional updated successfully",
      professionalId: id,
      companyId
    })

    return data
  }

  async deleteProfessional(id: string, companyId: string) {
    const supabase = await createServiceClient()

    // Verificar se o profissional existe e pertence à company
    await this.getProfessionalById(id, companyId)

    const {error} = await supabase.from("professionals").delete().eq("id", id).eq("company_id", companyId)

    if (error) {
      logger.error({
        message: "Failed to delete professional",
        error,
        professionalId: id,
        companyId
      })
      throw new Error("Failed to delete professional")
    }

    await activityLogService.log({
      companyId,
      action: "professional_deleted",
      resourceType: "professional",
      resourceId: id
    })

    logger.info({
      message: "Professional deleted successfully",
      professionalId: id,
      companyId
    })
  }
}

export const professionalService = new ProfessionalService()
