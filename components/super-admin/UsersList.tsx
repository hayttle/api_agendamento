"use client"

import {useEffect, useState, useImperativeHandle, forwardRef} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {LoadingSpinner} from "@/components/layout/LoadingSpinner"
import {ErrorAlert} from "@/components/layout/ErrorAlert"

interface User {
  id: string
  email: string
  name: string
  role: string
  companyId: string | null
  createdAt: string
}

export interface UsersListRef {
  refresh: () => Promise<void>
}

export const UsersList = forwardRef<UsersListRef>((props, ref) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/v1/users")
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao carregar usuários")
        return
      }

      setUsers(data.data || [])
    } catch (err) {
      setError("Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useImperativeHandle(ref, () => ({
    refresh: fetchUsers
  }))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Lista de todos os usuários</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários</CardTitle>
        <CardDescription>Lista de todos os usuários</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorAlert message={error} />
        ) : users.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhum usuário cadastrado</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
})

UsersList.displayName = "UsersList"
