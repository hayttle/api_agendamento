"use client"

import {useRef} from "react"
import {CreateApiKeyForm} from "./CreateApiKeyForm"
import {ApiKeysList, ApiKeysListRef} from "./ApiKeysList"

export function ApiKeysPageClient() {
  const apiKeysListRef = useRef<ApiKeysListRef>(null)

  const handleApiKeyCreated = () => {
    apiKeysListRef.current?.refresh()
  }

  return (
    <div className="grid gap-6">
      <CreateApiKeyForm onApiKeyCreated={handleApiKeyCreated} />
      <ApiKeysList ref={apiKeysListRef} />
    </div>
  )
}
