import {NextRequest, NextResponse} from "next/server"
import {requireSuperAdmin} from "@/lib/auth/helpers"
import {companyService} from "@/lib/services/company.service"
import {logger} from "@/lib/logger"
import {z} from "zod"
import type {ApiResponse} from "@/types/api"

const createCompanySchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    logger.request({
      method: "POST",
      path: "/api/v1/companies"
    })

    const user = await requireSuperAdmin()

    const body = await request.json()
    logger.debug({
      message: "Request payload",
      method: "POST",
      path: "/api/v1/companies",
      payload: body,
      userId: user.id
    })

    const validated = createCompanySchema.parse(body)

    const company = await companyService.createCompany({
      name: validated.name,
      slug: validated.slug,
      userId: user.id
    })

    const response: ApiResponse = {
      success: true,
      data: company
    }

    logger.response({
      method: "POST",
      path: "/api/v1/companies",
      statusCode: 201,
      duration: Date.now() - startTime,
      response: response,
      userId: user.id
    })

    return NextResponse.json(response, {status: 201})
  } catch (error) {
    logger.error({
      message: "Error creating company",
      method: "POST",
      path: "/api/v1/companies",
      error,
      duration: Date.now() - startTime
    })

    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: "Validation error",
        errors: error.flatten().fieldErrors
      }
      return NextResponse.json(response, {status: 400})
    }

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }
    return NextResponse.json(response, {status: 500})
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    logger.request({
      method: "GET",
      path: "/api/v1/companies"
    })

    const user = await requireSuperAdmin()

    const companies = await companyService.listCompanies()

    const response: ApiResponse = {
      success: true,
      data: companies
    }

    logger.response({
      method: "GET",
      path: "/api/v1/companies",
      statusCode: 200,
      duration: Date.now() - startTime,
      response: response,
      userId: user.id
    })

    return NextResponse.json(response)
  } catch (error) {
    logger.error({
      message: "Error listing companies",
      method: "GET",
      path: "/api/v1/companies",
      error,
      duration: Date.now() - startTime
    })

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }
    return NextResponse.json(response, {status: 500})
  }
}
