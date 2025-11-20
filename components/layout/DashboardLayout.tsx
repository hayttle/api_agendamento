"use client"

import {useRouter} from "next/navigation"
import {createClient} from "@/lib/supabase/client"
import {Button} from "@/components/ui/button"
import {LogOut} from "lucide-react"
import {Sidebar} from "./Sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: "super_admin" | "admin"
  userName: string
}

export function DashboardLayout({children, userRole, userName}: DashboardLayoutProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar userRole={userRole} />
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">API Agendamento</h1>
              <p className="text-sm text-muted-foreground">
                {userRole === "super_admin" ? "Super Admin" : "Admin"} - {userName}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
