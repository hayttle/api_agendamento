import {createServiceClient} from "@/lib/supabase/server"
import {logger} from "@/lib/logger"
import {activityLogService} from "./activity-log.service"
import type {UserRole} from "@/types/database"

export interface CreateUserParams {
  email: string
  name: string
  role: UserRole
  companyId: string | null
  createdBy?: string
}

export class UserService {
  async createUser(params: CreateUserParams) {
    const supabase = await createServiceClient()

    // Enviar convite por email (Supabase enviará link de confirmação)
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/accept-invite`

    const {data: authUser, error: authError} = await supabase.auth.admin.inviteUserByEmail(params.email, {
      data: {
        name: params.name
      },
      redirectTo
    })

    if (authError || !authUser.user) {
      logger.error({
        message: "Failed to invite user",
        error: authError,
        email: params.email
      })
      throw new Error(authError?.message || "Failed to invite user")
    }

    // Criar registro na tabela users
    const {data: user, error: userError} = await supabase
      .from("users")
      .insert({
        auth_user_id: authUser.user.id,
        company_id: params.companyId,
        role: params.role,
        name: params.name,
        email: params.email
      })
      .select()
      .single()

    if (userError || !user) {
      // Tentar remover o usuário do auth se falhar
      await supabase.auth.admin.deleteUser(authUser.user.id)

      logger.error({
        message: "Failed to create user record",
        error: userError,
        authUserId: authUser.user.id
      })
      throw new Error("Failed to create user record")
    }

    await activityLogService.log({
      companyId: params.companyId,
      userId: params.createdBy || null,
      action: "user_created",
      resourceType: "user",
      resourceId: user.id,
      metadata: {
        email: params.email,
        role: params.role
      }
    })

    logger.info({
      message: "User created successfully",
      userId: user.id,
      email: params.email,
      role: params.role
    })

    return user
  }

  async listUsers(companyId?: string) {
    const supabase = await createServiceClient()

    let query = supabase.from("users").select("*").order("created_at", {ascending: false})

    if (companyId) {
      query = query.eq("company_id", companyId)
    }

    const {data, error} = await query

    if (error) {
      logger.error({
        message: "Failed to list users",
        error,
        companyId
      })
      throw new Error("Failed to list users")
    }

    return data
  }
}

export const userService = new UserService()
