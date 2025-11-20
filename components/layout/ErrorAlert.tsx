import {cn} from "@/lib/utils"

interface ErrorAlertProps {
  message: string
  className?: string
}

export function ErrorAlert({message, className}: ErrorAlertProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive",
        className
      )}
    >
      {message}
    </div>
  )
}
