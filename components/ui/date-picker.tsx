"use client";

import * as React from "react";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

export function DatePicker({ value, onChange, disabled, placeholder = "Pick a date", id }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  
  // Parse the value to a Date object, handling empty strings
  const selectedDate = value && value.trim() ? new Date(value) : undefined;
  
  // Check if the parsed date is valid
  const isValidDate = selectedDate && !isNaN(selectedDate.getTime());

  // Generate years from 1900 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
  
  // Months array
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !isValidDate && "text-muted-foreground"
          )}
          disabled={disabled}
          id={id}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {isValidDate ? format(selectedDate, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {/* Year and Month Selectors */}
          <div className="flex gap-2 mb-3">
            <Select
              value={isValidDate ? selectedDate.getFullYear().toString() : ""}
              onValueChange={(year) => {
                const currentMonth = isValidDate ? selectedDate.getMonth() : 0;
                const currentDay = isValidDate ? selectedDate.getDate() : 1;
                const newDate = new Date(parseInt(year), currentMonth, currentDay);
                onChange(format(newDate, "yyyy-MM-dd"));
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={isValidDate ? selectedDate.getMonth().toString() : ""}
              onValueChange={(month) => {
                const currentYear = isValidDate ? selectedDate.getFullYear() : new Date().getFullYear();
                const currentDay = isValidDate ? selectedDate.getDate() : 1;
                const newDate = new Date(currentYear, parseInt(month), currentDay);
                onChange(format(newDate, "yyyy-MM-dd"));
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Calendar for day selection */}
          <Calendar
            mode="single"
            selected={isValidDate ? selectedDate : undefined}
            onSelect={(date) => {
              if (date) {
                // Format the date as YYYY-MM-DD for consistent storage
                onChange(format(date, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
            month={isValidDate ? selectedDate : new Date()}
            onMonthChange={(date) => {
              // Update the date when month changes from calendar navigation
              const currentDay = isValidDate ? selectedDate.getDate() : 1;
              const newDate = new Date(date.getFullYear(), date.getMonth(), currentDay);
              onChange(format(newDate, "yyyy-MM-dd"));
            }}
            disabled={(date) =>
              date < new Date("1900-01-01")
            }
            initialFocus
          />
          
          {/* Clear button */}
          {isValidDate && (
            <div className="mt-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="w-full"
              >
                Clear Date
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
