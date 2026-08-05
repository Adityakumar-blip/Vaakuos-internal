declare module 'react-date-range' {
    import { Component } from 'react';
    import { DateRangeProps, Range, RangeKeyDict } from 'react-date-range';

    export interface Range {
        startDate?: Date;
        endDate?: Date;
        key?: string;
        [key: string]: any;
    }

    export interface RangeKeyDict {
        [key: string]: Range;
    }

    export interface DateRangeProps {
        ranges?: Range[];
        onChange?: (ranges: RangeKeyDict) => void;
        editableDateInputs?: boolean;
        moveRangeOnFirstSelection?: boolean;
        rangeColors?: string[];
        [key: string]: any;
    }

    export class DateRange extends Component<DateRangeProps> {}
    export class Calendar extends Component<any> {}
    export class DateRangePicker extends Component<DateRangeProps> {}
    export interface DefinedRange {
        startDate: Date;
        endDate: Date;
        label: string;
    }
    export interface StaticRange {
        range: () => { startDate: Date; endDate: Date };
        isSelected: (range: { startDate: Date; endDate: Date }) => boolean;
        label?: string;
    }
    export const defaultStaticRanges: StaticRange[];
    export const defaultInputRanges: StaticRange[];
}

declare module 'react-date-range/dist/styles.css';
declare module 'react-date-range/dist/theme/default.css';
