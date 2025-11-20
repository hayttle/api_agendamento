"use client"

import Link from "next/link"
import {usePathname} from "next/navigation"
import {cn} from "@/lib/utils"
import {Building2, Users, Key} from "lucide-react"

interface SidebarProps {
  userRole: "super_admin" | "admin"
}

export function Sidebar({userRole}: SidebarProps) {
  const pathname = usePathname()

  const superAdminNav = [
    {
      title: "Companies",
      href: "/super-admin/companies",
      icon: Building2
    },
    {
      title: "Users",
      href: "/super-admin/users",
      icon: Users
    }
  ]

  const adminNav = [
    {
      title: "API Keys",
      href: "/admin/api-keys",
      icon: Key
    }
  ]

  const navItems = userRole === "super_admin" ? superAdminNav : adminNav

  return (
    <aside className="w-64 border-r bg-card min-h-[calc(100vh-73px)]">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
