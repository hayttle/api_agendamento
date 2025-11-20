import {NextResponse} from "next/server"
import openApiSpec from "@/lib/swagger/openapi.json"

export async function GET() {
  return NextResponse.json(openApiSpec)
}

