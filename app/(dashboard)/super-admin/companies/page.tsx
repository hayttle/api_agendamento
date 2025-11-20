import {redirect} from "next/navigation"
import {requireSuperAdmin, getCurrentUser} from "@/lib/auth/helpers"
import {DashboardLayout} from "@/components/layout/DashboardLayout"
import {CompaniesPageClient} from "@/components/super-admin/CompaniesPageClient"
import {logger} from "@/lib/logger"

export default async function CompaniesPage() {
  logger.info({
    message: "CompaniesPage: Acessando página de companies",
    path: "/super-admin/companies"
  })

  const user = await getCurrentUser()

  logger.debug({
    message: "CompaniesPage: Resultado do getCurrentUser",
    hasUser: !!user,
    userId: user?.id,
    role: user?.role
  })

  if (!user || user.role !== "super_admin") {
    logger.warn({
      message: "CompaniesPage: Acesso negado, redirecionando para /login",
      hasUser: !!user,
      role: user?.role
    })
    redirect("/login")
  }

  logger.info({
    message: "CompaniesPage: Acesso autorizado, renderizando página",
    userId: user.id,
    role: user.role
  })

  return (
    <DashboardLayout userRole={user.role} userName={user.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Companies</h2>
        </div>

        <CompaniesPageClient />
      </div>
    </DashboardLayout>
  )
}
