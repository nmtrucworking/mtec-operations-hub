import * as React from "react"
import { DayPicker } from "react-day-picker"
import { vi } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  fixedWeeks = true,
  fromYear,
  toYear,
  ...props
}: CalendarProps) {
  const currentYear = new Date().getFullYear()

  return (
    <DayPicker
      locale={vi}
      showOutsideDays={showOutsideDays}
      fixedWeeks={fixedWeeks}
      captionLayout="dropdown-buttons"
      fromYear={fromYear ?? currentYear - 80}
      toYear={toYear ?? currentYear + 10}
      className={cn("select-none p-3", className)}
      classNames={{
        months: "flex flex-col",
        month: "w-full space-y-3",

        caption: "relative flex h-9 items-center justify-center",
        caption_label: "hidden",
        caption_dropdowns: "flex max-w-[calc(100%-4.5rem)] items-center gap-1.5",

        dropdown_month: "relative min-w-0",
        dropdown_year: "relative min-w-0",
        dropdown: cn(
          "h-8 max-w-[8.5rem] cursor-pointer appearance-none rounded-md",
          "border border-border bg-card py-1 pl-2 pr-7 text-sm font-semibold text-primary",
          "transition-colors duration-150",
          "hover:border-border-highlight hover:bg-background",
          "focus:outline-none focus:ring-2 focus:ring-border-highlight/40",
          "[&>option]:bg-card [&>option]:text-primary",
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2364748b%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]",
          "bg-[length:16px] bg-[right_6px_center] bg-no-repeat"
        ),

        nav: "pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between",
        nav_button: cn(
          "pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md",
          "text-secondary transition-colors duration-150",
          "hover:bg-brand-light hover:text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-highlight/40"
        ),
        nav_button_previous: "",
        nav_button_next: "",

        table: "w-full border-collapse",
        head_row: "grid grid-cols-7",
        head_cell:
          "flex h-8 items-center justify-center text-[11px] font-semibold uppercase text-secondary",

        row: "grid grid-cols-7",
        cell: "relative flex h-9 items-center justify-center p-0 text-center",

        day: cn(
          "flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-primary",
          "transition-colors duration-150",
          "hover:bg-brand-light hover:text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-highlight/40"
        ),

        day_selected: cn(
          "bg-primary text-primary-foreground shadow-none",
          "hover:bg-primary-focus hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground"
        ),

        day_today: "border border-border-highlight text-primary",
        day_outside: "pointer-events-none text-secondary opacity-35",
        day_disabled: "pointer-events-none text-secondary opacity-25",
        day_hidden: "invisible",

        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
