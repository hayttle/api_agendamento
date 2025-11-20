import {redirect} from "next/navigation"
import {getCurrentUser} from "@/lib/auth/helpers"
import {logger} from "@/lib/logger"

export default async function DashboardLayout({children}: {children: React.ReactNode}) {
  logger.debug({
    message: "DashboardLayout: Verificando autenticação"
  })

  const user = await getCurrentUser()

  if (!user) {
    logger.warn({
      message: "DashboardLayout: Usuário não autenticado, redirecionando para /login"
    })
    redirect("/login")
  }

  logger.debug({
    message: "DashboardLayout: Usuário autenticado",
    userId: user.id,
    role: user.role
  })

  return <>{children}</>
}
