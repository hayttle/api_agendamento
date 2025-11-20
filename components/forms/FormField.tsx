import {Label} from "@/components/ui/label"
import {Input} from "@/components/ui/input"
import {cn} from "@/lib/utils"

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  error?: string
  className?: string
}

export function FormField({label, name, error, className, required, ...inputProps}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Input id={name} name={name} required={required} className={error ? "border-destructive" : ""} {...inputProps} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
