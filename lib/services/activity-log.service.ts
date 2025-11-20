import {createServiceClient} from "@/lib/supabase/server"

export interface LogActivityParams {
  companyId?: string | null
  userId?: string | null
  action: string
  resourceType: string
  resourceId?: string | null
  metadata?: Record<string, unknown> | null
}

export class ActivityLogService {
  async log(params: LogActivityParams): Promise<void> {
    const supabase = await createServiceClient()

    const {error} = await supabase.from("activity_logs").insert({
      company_id: params.companyId || null,
      user_id: params.userId || null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      metadata: params.metadata || null
    })

    if (error) {
      // Não falhar se o log falhar, apenas registrar no console
      console.error("Failed to log activity:", error)
    }
  }
}

export const activityLogService = new ActivityLogService()
