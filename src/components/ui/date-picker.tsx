import { forwardRef } from 'react';
import ReactDatePicker, { DatePickerProps as ReactDatePickerProps } from 'react-datepicker';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";

export interface DatePickerProps extends Omit<ReactDatePickerProps, 'onChange' | 'value' | 'selectsMultiple' | 'selectsRange'> {
    value?: Date | null;
    onChange?: (date: Date | null) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    className?: string;
    clearable?: boolean;
}

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
    ({
        value,
        onChange,
        placeholder = "Select date",
        label,
        className,
        clearable = false,
        disabled,
        ...props
    }, ref) => {

        return (
            <div className={cn("flex flex-col gap-1.5", className)} ref={ref}>
                {label && <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</span>}
                <div className="relative">
                    <ReactDatePicker
                        selected={value}
                        onChange={(date: Date | null | Date[]) => {
                            if (!Array.isArray(date)) {
                                onChange?.(date);
                            }
                        }}
                        disabled={disabled}
                        placeholderText={placeholder}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            "pl-10" // Make room for calendar icon
                        )}
                        wrapperClassName="w-full"
                        {...props}
                    />
                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />

                    {clearable && value && !disabled && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onChange?.(null);
                            }}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>
        );
    }
);

DatePicker.displayName = "DatePicker";
