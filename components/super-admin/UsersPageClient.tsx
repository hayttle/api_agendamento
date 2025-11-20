"use client"

import {useRef} from "react"
import {CreateUserForm} from "./CreateUserForm"
import {UsersList, type UsersListRef} from "./UsersList"

export function UsersPageClient() {
  const usersListRef = useRef<UsersListRef>(null)

  const handleUserCreated = () => {
    // Atualizar a lista quando um usuário for criado
    usersListRef.current?.refresh()
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <CreateUserForm onUserCreated={handleUserCreated} />
      <UsersList ref={usersListRef} />
    </div>
  )
}
