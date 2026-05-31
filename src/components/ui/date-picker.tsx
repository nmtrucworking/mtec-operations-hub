import * as React from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { CalendarDays, X } from "lucide-react"
import { cn } from "../../lib/utils"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

interface DatePickerProps {
  /** Controlled value in "YYYY-MM-DD" format */
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  clearable?: boolean
  fromYear?: number
  toYear?: number
}

const toDateValue = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")

  return `${y}-${m}-${d}`
}

const parseDateValue = (value?: string) => {
  if (!value) return undefined

  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return undefined

  const date = new Date(y, m - 1, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return undefined
  }

  return date
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  className,
  disabled,
  clearable = true,
  fromYear,
  toYear,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const today = React.useMemo(() => new Date(), [])
  const resolvedFromYear = fromYear ?? today.getFullYear() - 80
  const resolvedToYear = toYear ?? today.getFullYear() + 10

  const selected = React.useMemo(() => {
    return parseDateValue(value)
  }, [value])

  const handleSelect = (date: Date | undefined) => {
    if (!onChange) return

    onChange(date ? toDateValue(date) : "")
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange?.("")
    setOpen(false)
  }

  const displayText = selected
    ? format(selected, "dd/MM/yyyy", { locale: vi })
    : null

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (!disabled) setOpen(nextOpen)
      }}
    >
      <div className="relative w-full">
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              "group flex h-9 w-full items-center gap-2 rounded-md",
              "border border-border bg-card px-3 py-2 text-sm",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:border-border-highlight focus-visible:ring-2 focus-visible:ring-border-highlight/20",
              open && "border-border-highlight ring-2 ring-border-highlight/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              !displayText ? "text-secondary" : "text-primary",
              clearable && selected && !disabled && "pr-8",
              className
            )}
          >
            <CalendarDays
              size={15}
              className={cn(
                "shrink-0 transition-colors duration-150",
                open || selected ? "text-gold" : "text-secondary"
              )}
            />

            <span className="min-w-0 flex-1 truncate text-left leading-none">
              {displayText ?? placeholder}
            </span>
          </button>
        </PopoverTrigger>

        {clearable && selected && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Xóa ngày"
            className={cn(
              "absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded",
              "text-secondary hover:bg-border/70 hover:text-primary",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            )}
          >
            <X size={12} />
          </button>
        )}
      </div>

      <PopoverContent
        className="w-[min(calc(100vw-2rem),20rem)] overflow-hidden p-0"
        align="start"
        sideOffset={6}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          fromYear={resolvedFromYear}
          toYear={resolvedToYear}
          initialFocus
        />

        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
          <button
            type="button"
            onClick={() => handleSelect(new Date())}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-semibold text-gold",
              "hover:bg-gold/10 hover:text-gold-hover",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            )}
          >
            Hôm nay
          </button>

          {selected && (
            <button
              type="button"
              onClick={() => handleSelect(undefined)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium text-secondary",
                "hover:bg-border/60 hover:text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              )}
            >
              Xóa
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
