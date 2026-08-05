import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AddFilterButton,
  FilterPills,
  useDataFilters,
  type FilterField,
} from "@/components/common/filters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Pill } from "@/components/ui/pill";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Permission } from "@/lib/permissions";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetActivityLogsQuery, usePurgeActivityLogsMutation } from "@/store/api/logsApi";
import { useGetUsersQuery } from "@/store/api/userApi";
import type { ActivityLog } from "@/types/owner.types";
import { ACTIVITY_LOG_MODULES } from "@/constants/activityLogModules";
import { format } from "date-fns";
import { toast } from "sonner";
import { X, Eye, Trash2, AlertTriangle, Boxes, Zap, User, CalendarDays } from "lucide-react";

// Backend takes a single `level`; the default view wants both error and warning,
// so we send them comma-joined and let the API interpret the combined filter.
const DEFAULT_LEVEL = "error,warning";

export default function ErrorLogsPage() {
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
  const [level, setLevel] = useState<string>(DEFAULT_LEVEL);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [detailsLog, setDetailsLog] = useState<ActivityLog | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeBefore, setPurgeBefore] = useState("");

  const valueOf = (fieldId: string) => filters.filters.find((f) => f.fieldId === fieldId)?.values[0] ?? "";
  const module = valueOf("module");
  const action = valueOf("action");
  const actor = valueOf("actor");
  const [dateFrom = "", dateTo = ""] = filters.filters.find((f) => f.fieldId === "dateRange")?.values ?? [];

  const debouncedModule = useDebounce(module, 400);
  const debouncedAction = useDebounce(action, 400);
  const debouncedActor = useDebounce(actor, 400);

  const hasFilters = filters.activeCount > 0 || level !== DEFAULT_LEVEL;

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedModule, debouncedAction, debouncedActor, level, dateFrom, dateTo]);

  const { data, isLoading, isFetching, error, refetch } = useGetActivityLogsQuery({
    page: pageIndex + 1,
    perPage: pageSize,
    module: debouncedModule || undefined,
    action: debouncedAction || undefined,
    userId: debouncedActor || undefined,
    level,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const logs = data?.data ?? [];
  const totalItems = data?.total ?? 0;

  const [purgeLogs, { isLoading: isPurging }] = usePurgeActivityLogsMutation();

  const clearFilters = () => {
    filters.clearAll();
    setLevel(DEFAULT_LEVEL);
  };

  const handlePurge = async () => {
    try {
      await purgeLogs(purgeBefore ? { before: purgeBefore } : undefined).unwrap();
      toast.success("Logs purged successfully");
      setPurgeOpen(false);
      setPurgeBefore("");
    } catch {
      toast.error("Failed to purge logs");
    }
  };

  const columns: Column<ActivityLog>[] = [
    {
      key: "level",
      header: "Level",
      render: (log) => (
        <Pill tone={log.level === "error" ? "danger" : log.level === "warning" ? "warning" : "neutral"} uppercase>
          {log.level}
        </Pill>
      ),
    },
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
      key: "message",
      header: "Message",
      className: "max-w-[360px] whitespace-normal",
      render: (log) => <span className="text-sm">{log.message}</span>,
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
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (log) => (
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setDetailsLog(log)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Error Logs</h1>
          <p className="mt-1 text-muted-foreground">Warnings and errors raised across the platform</p>
        </div>
        <PermissionGuard permission={Permission.AUDIT_LOGS_MANAGE}>
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setPurgeOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Purge Logs
          </Button>
        </PermissionGuard>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_LEVEL}>Error &amp; Warning</SelectItem>
            <SelectItem value="error">Error only</SelectItem>
            <SelectItem value="warning">Warning only</SelectItem>
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
        emptyMessage="No errors or warnings found"
        emptyDescription="Errors and warnings raised across the platform will show up here"
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

      {/* Log details */}
      <Dialog open={!!detailsLog} onOpenChange={(open) => !open && setDetailsLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
            <DialogDescription>{detailsLog?.message}</DialogDescription>
          </DialogHeader>
          {detailsLog && (
            <div className="space-y-3 text-sm">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <dt className="text-muted-foreground">Module</dt>
                <dd>{detailsLog.module}</dd>
                <dt className="text-muted-foreground">Action</dt>
                <dd>{detailsLog.action}</dd>
                <dt className="text-muted-foreground">User</dt>
                <dd>{detailsLog.userName || detailsLog.userId || "System"}</dd>
                <dt className="text-muted-foreground">Resource</dt>
                <dd>{detailsLog.resourceType || detailsLog.resourceId ? `${detailsLog.resourceType ?? ""} ${detailsLog.resourceId ?? ""}`.trim() : "—"}</dd>
                <dt className="text-muted-foreground">IP Address</dt>
                <dd>{detailsLog.ipAddress || "—"}</dd>
                <dt className="text-muted-foreground">Timestamp</dt>
                <dd>{format(new Date(detailsLog.createdAt), "MMM dd, yyyy HH:mm:ss")}</dd>
              </dl>
              {detailsLog.userAgent && (
                <div>
                  <p className="text-muted-foreground mb-1">User Agent</p>
                  <p className="break-all text-xs">{detailsLog.userAgent}</p>
                </div>
              )}
              {detailsLog.details && (
                <div>
                  <p className="text-muted-foreground mb-1">Details</p>
                  <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(detailsLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Purge confirmation */}
      <AlertDialog open={purgeOpen} onOpenChange={(open) => { setPurgeOpen(open); if (!open) setPurgeBefore(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Purge Logs</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This permanently deletes log entries and cannot be undone. Leave the date blank to purge everything,
              or purge only entries older than a given date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <label htmlFor="purge-before" className="text-sm text-muted-foreground">
              Purge entries older than (optional)
            </label>
            <Input
              id="purge-before"
              type="date"
              value={purgeBefore}
              onChange={(e) => setPurgeBefore(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPurging}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handlePurge();
              }}
              disabled={isPurging}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isPurging ? "Purging..." : "Purge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
