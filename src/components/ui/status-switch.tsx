import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface StatusSwitchProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    label: string;
    description?: string;
    disabled?: boolean;
    id?: string;
    className?: string;
}

export function StatusSwitch({
    checked,
    onCheckedChange,
    label,
    description,
    disabled = false,
    id,
    className,
}: StatusSwitchProps) {
    const generatedId = React.useId();
    const switchId = id || `status-switch-generated-${generatedId}`;

    return (
        <div className={cn("flex items-center justify-between gap-4 py-3 px-4 rounded-lg border bg-card transition-colors hover:bg-accent/5", className)}>
            <div className="flex-1 space-y-1">
                <Label
                    htmlFor={switchId}
                    className={cn(
                        "text-base font-semibold cursor-pointer select-none",
                        disabled && "cursor-not-allowed opacity-50"
                    )}
                >
                    {label}
                </Label>
                {description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            <Switch
                id={switchId}
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
                className="data-[state=checked]:bg-primary"
            />
        </div>
    );
}
