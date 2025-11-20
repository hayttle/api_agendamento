"use client"

import {useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {ErrorAlert} from "@/components/layout/ErrorAlert"
import {LoadingSpinner} from "@/components/layout/LoadingSpinner"
import {ApiKeyModal} from "@/components/modals/ApiKeyModal"

interface CreateApiKeyFormProps {
  onApiKeyCreated?: () => void
}

export function CreateApiKeyForm({onApiKeyCreated}: CreateApiKeyFormProps) {
  const [label, setLabel] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<{key: string; label: string} | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({label})
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao criar API key")
        setLoading(false)
        return
      }

      setGeneratedKey({key: data.data.key, label: data.data.label})
      setModalOpen(true)
      setLabel("")

      // Notificar o componente pai para atualizar a lista
      if (onApiKeyCreated) {
        onApiKeyCreated()
      }
    } catch (err) {
      setError("Erro ao criar API key. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gerar API Key</CardTitle>
          <CardDescription>Crie uma nova chave de API para sua company</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorAlert message={error} />}

            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="ex: Produção, Desenvolvimento, etc."
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Gerando...
                </>
              ) : (
                "Gerar API Key"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {generatedKey && (
        <ApiKeyModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          apiKey={generatedKey.key}
          label={generatedKey.label}
        />
      )}
    </>
  )
}
