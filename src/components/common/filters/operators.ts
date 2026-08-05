import type { FilterFieldType, OperatorId } from "./types";

export interface OperatorDef {
  id: OperatorId;
  label: string;
  /** does a row's value satisfy this operator given the selected values? */
  test: (rowValue: unknown, values: string[]) => boolean;
}

const asArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (v === null || v === undefined || v === "") return [];
  return [String(v)];
};

const overlaps = (rowValue: unknown, values: string[]) => {
  const set = asArray(rowValue);
  return values.some((v) => set.includes(v));
};

const asText = (v: unknown) => String(v ?? "").toLowerCase();
const asDate = (v: unknown) => {
  const d = new Date(v as any);
  return isNaN(d.getTime()) ? null : d;
};

export const OPERATORS: Record<OperatorId, OperatorDef> = {
  is: { id: "is", label: "is", test: (rv, vals) => (vals.length === 0 ? true : overlaps(rv, vals)) },
  isNot: { id: "isNot", label: "is not", test: (rv, vals) => (vals.length === 0 ? true : !overlaps(rv, vals)) },
  isAnyOf: { id: "isAnyOf", label: "is any of", test: (rv, vals) => (vals.length === 0 ? true : overlaps(rv, vals)) },
  isNoneOf: { id: "isNoneOf", label: "is none of", test: (rv, vals) => (vals.length === 0 ? true : !overlaps(rv, vals)) },
  contains: {
    id: "contains",
    label: "contains",
    test: (rv, vals) => (vals.length === 0 ? true : asText(rv).includes(asText(vals[0]))),
  },
  notContains: {
    id: "notContains",
    label: "does not contain",
    test: (rv, vals) => (vals.length === 0 ? true : !asText(rv).includes(asText(vals[0]))),
  },
  before: {
    id: "before",
    label: "before",
    test: (rv, vals) => {
      if (!vals.length) return true;
      const a = asDate(rv);
      const b = asDate(vals[0]);
      return a && b ? a < b : false;
    },
  },
  after: {
    id: "after",
    label: "after",
    test: (rv, vals) => {
      if (!vals.length) return true;
      const a = asDate(rv);
      const b = asDate(vals[0]);
      return a && b ? a > b : false;
    },
  },
  between: {
    id: "between",
    label: "between",
    test: (rv, [from, to]) => {
      const a = asDate(rv);
      if (!a) return false;
      if (from && a < (asDate(from) as Date)) return false;
      if (to && a > (asDate(to) as Date)) return false;
      return true;
    },
  },
};

export const DEFAULT_OPERATORS: Record<FilterFieldType, OperatorId[]> = {
  select: ["is", "isNot"],
  multiselect: ["isAnyOf", "isNoneOf"],
  text: ["contains", "notContains"],
  date: ["between"],
  boolean: ["is"],
};

export const defaultOperatorFor = (type: FilterFieldType): OperatorId =>
  DEFAULT_OPERATORS[type][0];
