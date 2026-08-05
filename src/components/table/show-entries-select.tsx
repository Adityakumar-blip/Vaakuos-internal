import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ShowEntriesSelectProps {
    value: number;
    onChange: (value: number) => void;
}

const ENTRIES_OPTIONS = [2, 5, 10, 25, 50];

export function ShowEntriesSelect({ value, onChange }: ShowEntriesSelectProps) {
    return (
        <div className="flex items-center gap-2">
            <Label htmlFor="entries-select" className="text-sm font-normal whitespace-nowrap">
                Show
            </Label>
            <Select
                value={value.toString()}
                onValueChange={(val) => onChange(Number(val))}
            >
                <SelectTrigger id="entries-select" className="w-[80px] h-9">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {ENTRIES_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option.toString()}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Label htmlFor="entries-select" className="text-sm font-normal whitespace-nowrap">
                Entries
            </Label>
        </div>
    );
}
