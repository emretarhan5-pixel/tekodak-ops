"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { tr as trDayPicker } from "react-day-picker/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parseIsoDate, toIsoDate } from "@/lib/utils/iso-date";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  id?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  fromYear?: number;
  toYear?: number;
  className?: string;
};

export function DatePicker({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = "Tarih seçin",
  fromYear = 2020,
  toYear = 2030,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);

  const label = selected
    ? format(selected, "dd.MM.yyyy", { locale: tr })
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            id={id}
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-10 w-full justify-start gap-2 px-3 font-normal",
              !selected && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{label}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={trDayPicker}
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            onChange(date ? toIsoDate(date) : undefined);
            setOpen(false);
          }}
          captionLayout="dropdown"
          fromYear={fromYear}
          toYear={toYear}
          formatters={{
            formatMonthDropdown: (date) =>
              format(date, "LLLL", { locale: tr }),
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
