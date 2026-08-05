import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MagnifyingGlassIcon as Search, FunnelIcon as Filter, TrashIcon as Trash2 } from '@heroicons/react/24/outline';
import { ShowEntriesSelect } from './show-entries-select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TableHeaderProps {
    // Pagination
    entriesPerPage: number;
    onEntriesChange: (value: number) => void;

    // Search
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;

    // Actions
    actionButton?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
    };

    // Delete
    showDelete?: boolean;
    deleteDisabled?: boolean;
    onDelete?: () => void;

    // Filter
    showFilter?: boolean;
    children?: React.ReactNode; // Filter content
    /** modern filter control (e.g. <AddFilterButton/>) rendered next to the search */
    filterSlot?: React.ReactNode;
}

export function TableHeader({
    entriesPerPage,
    onEntriesChange,
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search...',
    actionButton,
    showDelete = false,
    deleteDisabled = true,
    onDelete,
    showFilter = false,
    children,
    filterSlot,
}: TableHeaderProps) {
    return (
        <div className="w-full mb-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
                {/* Left: Show Entries */}
                <div className="flex-shrink-0">
                    <ShowEntriesSelect value={entriesPerPage} onChange={onEntriesChange} />
                </div>

                {/* Right: Actions and Search */}
                <div className="flex flex-col sm:flex-row gap-2 flex-1 lg:flex-initial lg:justify-end">
                    {/* Search Field - Full width on mobile, fixed on desktop */}
                    <div className="relative w-full sm:w-auto sm:min-w-[250px] lg:min-w-[300px] order-1 sm:order-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex gap-2 order-2 sm:order-1">
                        {/* Modern filter control */}
                        {filterSlot}

                        {/* Filter Button (legacy dropdown) */}
                        {showFilter && children && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="default" className="gap-2 flex-1 sm:flex-initial">
                                        <Filter className="w-4 h-4" />
                                        <span className="hidden sm:inline">Filter</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[300px]">
                                    {children}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Delete Button */}
                        {showDelete && (
                            <Button
                                variant="destructive"
                                onClick={onDelete}
                                disabled={deleteDisabled}
                                className="gap-2 flex-1 sm:flex-initial"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Delete</span>
                            </Button>
                        )}

                        {/* Action Button */}
                        {actionButton && (
                            <Button onClick={actionButton.onClick} className="gap-2 flex-1 sm:flex-initial whitespace-nowrap">
                                {actionButton.icon}
                                <span className="hidden sm:inline">{actionButton.label}</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
