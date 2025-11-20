"use client"

import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {useState} from "react"
import {Copy, Check} from "lucide-react"

interface ApiKeyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiKey: string
  label: string
}

export function ApiKeyModal({open, onOpenChange, apiKey, label}: ApiKeyModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Key Gerada</DialogTitle>
          <DialogDescription>
            Esta chave será exibida apenas uma vez. Certifique-se de copiá-la e armazená-la em local seguro.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Label</label>
            <p className="text-sm font-mono bg-muted p-2 rounded mt-1">{label}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">API Key</label>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm font-mono bg-muted p-2 rounded flex-1 break-all">{apiKey}</p>
              <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Atenção: Esta chave não poderá ser visualizada novamente após fechar este modal.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
