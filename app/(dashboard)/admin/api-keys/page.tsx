import {redirect} from "next/navigation"
import {getCurrentUser} from "@/lib/auth/helpers"
import {DashboardLayout} from "@/components/layout/DashboardLayout"
import {ApiKeysPageClient} from "@/components/admin/ApiKeysPageClient"

export default async function ApiKeysPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    redirect("/login")
  }

  return (
    <DashboardLayout userRole={user.role} userName={user.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">API Keys</h2>
        </div>

        <ApiKeysPageClient />
      </div>
    </DashboardLayout>
  )
}
