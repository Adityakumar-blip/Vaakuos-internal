import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    EllipsisHorizontalIcon,
    PencilIcon,
    TrashIcon,
    ShieldCheckIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface ActionItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    className?: string;
}

interface RowActionsProps {
    onEdit?: () => void;
    onDelete?: () => void;
    onView?: () => void;
    editLabel?: string;
    deleteLabel?: string;
    viewLabel?: string;
    extraActions?: ActionItem[];
    triggerIcon?: React.ReactNode;
    className?: string;
}

export function RowActions({
    onEdit,
    onDelete,
    onView,
    editLabel = "Edit",
    deleteLabel = "Delete",
    viewLabel = "View Details",
    extraActions = [],
    triggerIcon = <EllipsisHorizontalIcon className="w-4 h-4" />,
    className,
}: RowActionsProps) {
    if (!onEdit && !onDelete && !onView && extraActions.length === 0) {
        return null;
    }

    return (
        <div className={cn("flex justify-end", className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                        {triggerIcon}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {onEdit && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                            <PencilIcon className="w-4 h-4 mr-2" />
                            {editLabel}
                        </DropdownMenuItem>
                    )}

                    {onView && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                            <ShieldCheckIcon className="w-4 h-4 mr-2" />
                            {viewLabel}
                        </DropdownMenuItem>
                    )}

                    {extraActions.map((action, index) => (
                        <DropdownMenuItem
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                action.onClick();
                            }}
                            className={action.className}
                        >
                            {action.icon}
                            {action.icon && <span className="mr-2" />}
                            {action.label}
                        </DropdownMenuItem>
                    ))}

                    {onDelete && (
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        >
                            <TrashIcon className="w-4 h-4 mr-2" />
                            {deleteLabel}
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
