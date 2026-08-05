"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange, Range, RangeKeyDict, DateRangePicker as DateRangePickerLib, DateRangeProps } from "react-date-range"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

// Extending the library props but excluding 'onChange' to strictly type it or handle it our way if needed.
// However, the library 'onChange' returns RangeKeyDict.
export interface DateRangePickerProps extends Omit<DateRangeProps, 'onChange'> {
    className?: string
    date?: Range
    onDateChange?: (range: Range) => void
    placeholder?: string
    align?: "center" | "start" | "end"
    /**
     * If true, uses the library's DateRangePicker component which includes defining ranges sidebar.
     * If false (default), uses the DateRange component (calendar only).
     */
    showSidebar?: boolean
    /**
     * Optional label for the trigger button
     */
    label?: string
}

export function DateRangePicker({
    className,
    date,
    onDateChange,
    placeholder = "Pick a date",
    align = "start",
    showSidebar = false,
    label,
    ...props
}: DateRangePickerProps) {
    const [internalDate, setInternalDate] = React.useState<Range>(
        date || {
            startDate: new Date(),
            endDate: new Date(),
            key: 'selection',
        }
    )

    // Sync internal state with prop
    React.useEffect(() => {
        if (date) {
            setInternalDate(date)
        }
    }, [date])

    const handleChange = (item: RangeKeyDict) => {
        const selection = item.selection || item.range1;
        setInternalDate(selection)
        if (onDateChange) {
            onDateChange(selection)
        }
    }

    const ComponentToRender = showSidebar ? DateRangePickerLib : DateRange;

    // Type assertion for ComponentToRender to avoid TS errors with dynamic component
    const CalendarComponent = ComponentToRender as React.ComponentType<DateRangeProps>;

    return (
        <div className={cn("grid gap-2", className)}>
            {label && <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</span>}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground",
                            className
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {internalDate?.startDate ? (
                            internalDate.endDate ? (
                                <>
                                    {format(internalDate.startDate, "LLL dd, y")} -{" "}
                                    {format(internalDate.endDate, "LLL dd, y")}
                                </>
                            ) : (
                                format(internalDate.startDate, "LLL dd, y")
                            )
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align={align}>
                    {/* Custom wrapper to override styles for theme consistency */}
                    <div className={cn("p-2 aura-date-range-wrapper", showSidebar && "aura-date-range-sidebar-wrapper")}>
                        <CalendarComponent
                            editableDateInputs={true}
                            onChange={handleChange}
                            moveRangeOnFirstSelection={false}
                            ranges={[internalDate]}
                            rangeColors={['hsl(var(--primary))']} // Use primary color
                            {...props}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
