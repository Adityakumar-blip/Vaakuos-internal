import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Pill } from "@/components/ui/pill";
import {
  AddFilterButton,
  FilterPills,
  useDataFilters,
  type FilterField,
} from "@/components/common/filters";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetActivityLogsQuery } from "@/store/api/logsApi";
import { useGetUsersQuery } from "@/store/api/userApi";
import type { ActivityLog } from "@/types/owner.types";
import { ACTIVITY_LOG_MODULES } from "@/constants/activityLogModules";
import { format } from "date-fns";
import { Boxes, Zap, User, CalendarDays, X } from "lucide-react";

const LEVEL_TONE: Record<ActivityLog["level"], "neutral" | "warning" | "danger"> = {
  info: "neutral",
  warning: "warning",
  error: "danger",
};

export default function AuditTrailPage() {
  // ponytail: first page of team members (max the backend allows); switch to
  // a searchable/paginated picker if a tenant ever has 100+ users.
  const { data: usersData } = useGetUsersQuery({ perPage: 100 });

  const filterFields: FilterField[] = useMemo(() => [
    { id: "module", label: "Module", icon: Boxes, type: "select", options: ACTIVITY_LOG_MODULES },
    { id: "action", label: "Action", icon: Zap, type: "text" },
    {
      id: "actor",
      label: "User",
      icon: User,
      type: "select",
      searchable: true,
      options: (usersData?.data ?? []).map((u) => ({ label: u.name || u.email, value: u.id })),
    },
    { id: "dateRange", label: "Date range", icon: CalendarDays, type: "date" },
  ], [usersData]);

  const filters = useDataFilters(filterFields);
  const [level, setLevel] = useState<string>("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const valueOf = (fieldId: string) => filters.filters.find((f) => f.fieldId === fieldId)?.values[0] ?? "";
  const module = valueOf("module");
  const action = valueOf("action");
  const actor = valueOf("actor");
  const [dateFrom = "", dateTo = ""] = filters.filters.find((f) => f.fieldId === "dateRange")?.values ?? [];

  const debouncedModule = useDebounce(module, 400);
  const debouncedAction = useDebounce(action, 400);
  const debouncedActor = useDebounce(actor, 400);

  const hasFilters = filters.activeCount > 0 || level !== "all";

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedModule, debouncedAction, debouncedActor, level, dateFrom, dateTo]);

  const { data, isLoading, isFetching, error, refetch } = useGetActivityLogsQuery({
    page: pageIndex + 1,
    perPage: pageSize,
    module: debouncedModule || undefined,
    action: debouncedAction || undefined,
    userId: debouncedActor || undefined,
    level: level !== "all" ? level : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const logs = data?.data ?? [];
  const totalItems = data?.total ?? 0;

  const clearFilters = () => {
    filters.clearAll();
    setLevel("all");
  };

  const columns: Column<ActivityLog>[] = [
    {
      key: "actor",
      header: "User",
      sortValue: (log) => log.userName || log.userId || "",
      render: (log) => (
        <span className="font-medium text-foreground">
          {log.userName || log.userId || <span className="text-muted-foreground font-normal">System</span>}
        </span>
      ),
    },
    {
      key: "module",
      header: "Module",
      render: (log) => <Pill tone="neutral">{log.module}</Pill>,
    },
    {
      key: "action",
      header: "Action",
      render: (log) => <Pill tone={LEVEL_TONE[log.level]}>{log.action}</Pill>,
    },
    {
      key: "resource",
      header: "Resource",
      render: (log) =>
        log.resourceType || log.resourceId ? (
          <span className="text-sm text-muted-foreground">
            {log.resourceType}
            {log.resourceType && log.resourceId ? ": " : ""}
            {log.resourceId}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "createdAt",
      header: "Timestamp",
      render: (log) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
        <p className="mt-1 text-muted-foreground">A record of actions taken across the platform</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <AddFilterButton
          fields={filterFields}
          active={filters.filters}
          onSet={filters.setFilter}
          compact={filters.activeCount > 0}
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      <DataTable
        data={logs}
        columns={columns}
        isLoading={isLoading || isFetching}
        error={error}
        onRetry={refetch}
        toolbar={filters.activeCount > 0 ? <FilterPills controller={filters} /> : undefined}
        emptyMessage="No activity found"
        emptyDescription="Actions taken across the platform will show up here"
        showPagination
        totalItems={totalItems}
        pageSize={pageSize}
        initialPageIndex={pageIndex}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
      />
    </div>
  );
}
