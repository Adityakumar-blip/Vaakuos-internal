import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Shield,
  Users,
  Settings,
  Check,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Zap,
  Lock,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAddRoleMutation,
  useGetRoleByIdQuery,
  useUpdateRoleMutation,
} from "@/store/api/roleApi";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getPermissionModuleTreeByAdminType } from "@/constants/permissionModules";
import { useAuth } from "@/context/AuthContext";
import { deriveAdminType } from "@/utils/adminType";

// Permission action icons
const getActionIcon = (action: string) => {
  if (action.includes("read") || action.includes("view"))
    return <Eye className="h-4 w-4" />;
  if (action.includes("create")) return <Plus className="h-4 w-4" />;
  if (action.includes("update")) return <Pencil className="h-4 w-4" />;
  if (action.includes("delete")) return <Trash2 className="h-4 w-4" />;
  if (action.includes("manage")) return <Settings className="h-4 w-4" />;
  if (action.includes("execute")) return <Zap className="h-4 w-4" />;
  if (action.includes("approve")) return <Check className="h-4 w-4" />;
  if (action.includes("invite")) return <Users className="h-4 w-4" />;
  return <Check className="h-4 w-4" />;
};

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  permissions: z
    .array(z.string())
    .min(1, "Please select at least one permission"),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormPageProps {
  backTo: string;
}

// ============================================================================
// PERMISSION MODULE GROUPS
// ============================================================================

type PermissionModuleNode = ReturnType<
  typeof getPermissionModuleTreeByAdminType
>[number];

const flattenPermissionTree = (
  nodes: PermissionModuleNode[],
): PermissionModuleNode[] =>
  nodes.flatMap((node) => [
    node,
    ...flattenPermissionTree(node.children || []),
  ]);

const uniqueValues = (values: string[]) => [...new Set(values)];

export function RoleFormPage({ backTo }: RoleFormPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const isEditMode = Boolean(id);
  const adminType = user
    ? deriveAdminType(user.adminType, user.tenantType)
    : undefined;
  const permissionTree = useMemo(
    () => (adminType ? getPermissionModuleTreeByAdminType(adminType) : []),
    [adminType],
  );
  const permissionModules = useMemo(
    () => flattenPermissionTree(permissionTree),
    [permissionTree],
  );

  const { data: role, isLoading: isLoadingRole } = useGetRoleByIdQuery(
    id || "",
    {
      skip: !isEditMode,
    },
  );
  const [addRole, { isLoading: isCreating }] = useAddRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

  const {
    register,
    handleSubmit: handleFormSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  const selectedPermissions = watch("permissions");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRootId, setSelectedRootId] = useState<string | null>(null);

  // Calculate permission stats
  const permissionStats = useMemo(() => {
    const allPermissionKeys = uniqueValues(
      permissionModules.flatMap((module) =>
        module.features.map((feature) => feature.key),
      ),
    );
    return {
      total: allPermissionKeys.length,
      selected: selectedPermissions.length,
      percentage:
        allPermissionKeys.length > 0
          ? Math.round(
              (selectedPermissions.length / allPermissionKeys.length) * 100,
            )
          : 0,
    };
  }, [permissionModules, selectedPermissions]);

  useEffect(() => {
    if (role && isEditMode) {
      reset({
        name: role.name,
        description: role.description || "",
        permissions: role.permissions || [],
      });
    }
  }, [role, isEditMode, reset]);

  useEffect(() => {
    if (!selectedRootId && permissionTree.length > 0) {
      setSelectedRootId(permissionTree[0].id);
    }
  }, [permissionTree, selectedRootId]);

  const handlePermissionToggle = (permission: string) => {
    const nextPermissions = new Set(selectedPermissions);
    if (nextPermissions.has(permission)) {
      nextPermissions.delete(permission);
    } else {
      nextPermissions.add(permission);
    }
    setValue("permissions", Array.from(nextPermissions), {
      shouldValidate: true,
    });
  };

  const toggleModulePermissions = (moduleId: string, permissions: string[]) => {
    const nextPermissions = new Set(selectedPermissions);
    const allSelected = permissions.every((permission) =>
      nextPermissions.has(permission),
    );

    if (allSelected) {
      permissions.forEach((permission) => nextPermissions.delete(permission));
    } else {
      permissions.forEach((permission) => nextPermissions.add(permission));
    }

    setValue("permissions", Array.from(nextPermissions), {
      shouldValidate: true,
    });
  };

  const toggleTreePermissions = (modules: PermissionModuleNode[]) => {
    const nextPermissions = new Set(selectedPermissions);
    const allPermissions = uniqueValues(
      flattenPermissionTree(modules).flatMap((m) =>
        m.features.map((f) => f.key),
      ),
    );
    const allSelected = allPermissions.every((permission) =>
      nextPermissions.has(permission),
    );

    if (allSelected) {
      allPermissions.forEach((permission) =>
        nextPermissions.delete(permission),
      );
    } else {
      allPermissions.forEach((permission) => nextPermissions.add(permission));
    }

    setValue("permissions", Array.from(nextPermissions), {
      shouldValidate: true,
    });
  };

  const isPermissionSelected = (permission: string) =>
    selectedPermissions.includes(permission);

  const getModuleSelectedCount = (module: (typeof permissionModules)[0]) => {
    return module.features.filter((feature) =>
      isPermissionSelected(feature.key),
    ).length;
  };

  const isModuleFullySelected = (module: (typeof permissionModules)[0]) => {
    return module.features.every((feature) =>
      isPermissionSelected(feature.key),
    );
  };

  const isModulePartiallySelected = (module: (typeof permissionModules)[0]) => {
    const selectedCount = getModuleSelectedCount(module);
    return selectedCount > 0 && selectedCount < module.features.length;
  };

  const getTreePermissions = (module: PermissionModuleNode) =>
    module.children?.length ? flattenPermissionTree(module.children) : [module];

  const getTreePermissionKeys = (module: PermissionModuleNode) =>
    uniqueValues(
      getTreePermissions(module).flatMap((node) =>
        node.features.map((feature) => feature.key),
      ),
    );

  const getTreeSelectedCount = (module: PermissionModuleNode) => {
    return getTreePermissionKeys(module).filter((permission) =>
      isPermissionSelected(permission),
    ).length;
  };

  const isTreeFullySelected = (module: PermissionModuleNode) => {
    const permissions = getTreePermissionKeys(module);
    return (
      permissions.length > 0 &&
      permissions.every((permission) => isPermissionSelected(permission))
    );
  };

  const handleSubmit = async (data: RoleFormValues) => {
    try {
      const roleData = {
        name: data.name,
        description: data.description || undefined,
        permissions: data.permissions,
      };

      if (isEditMode && id) {
        await updateRole({ id, data: roleData }).unwrap();
        toast({
          title: "Success",
          description: "Role updated successfully",
        });
      } else {
        await addRole(roleData).unwrap();
        toast({
          title: "Success",
          description: "Role created successfully",
        });
      }

      navigate(backTo);
    } catch (error) {
      console.error("Failed to save role:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? "update" : "create"} role. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Filter the menu tree based on search
  const filterPermissionTree = (
    modules: PermissionModuleNode[],
  ): PermissionModuleNode[] => {
    if (!searchQuery) return modules;
    const query = searchQuery.toLowerCase();
    return modules
      .map((module) => {
        const children = filterPermissionTree(module.children || []);
        const matchesModule =
          module.label.toLowerCase().includes(query) ||
          module.description?.toLowerCase().includes(query) ||
          module.features.some(
            (feature) =>
              feature.label.toLowerCase().includes(query) ||
              feature.key.toLowerCase().includes(query),
          );

        if (!matchesModule && children.length === 0) return null;

        return {
          ...module,
          children,
        };
      })
      .filter(Boolean) as PermissionModuleNode[];
  };

  const visiblePermissionTree = filterPermissionTree(permissionTree);
  const selectedRoot =
    visiblePermissionTree.find((module) => module.id === selectedRootId) ||
    visiblePermissionTree[0];

  const renderPermissionActions = (module: PermissionModuleNode, depth = 0) => (
    <div className="space-y-2">
      {module.features.map((feature) => (
        <Tooltip key={feature.key}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => handlePermissionToggle(feature.key)}
              className={cn(
                "flex min-h-9 w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                isPermissionSelected(feature.key)
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-muted/40 hover:bg-accent hover:text-accent-foreground",
              )}
              style={{
                marginLeft: `${depth * 28}px`,
                width: `calc(100% - ${depth * 28}px)`,
              }}
            >
              <Checkbox
                checked={isPermissionSelected(feature.key)}
                className="pointer-events-none"
              />
              <span className="flex min-w-0 items-center gap-1.5">
                {getActionIcon(feature.key)}
                <span className="truncate">{feature.label}</span>
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{feature.label}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {feature.key}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );

  const renderTreeNode = (module: PermissionModuleNode, depth = 0) => {
    const hasChildren = Boolean(module.children?.length);
    const selectedCount = hasChildren
      ? getTreeSelectedCount(module)
      : getModuleSelectedCount(module);
    const totalCount = hasChildren
      ? getTreePermissionKeys(module).length
      : module.features.length;
    const fullySelected = hasChildren
      ? isTreeFullySelected(module)
      : isModuleFullySelected(module);

    return (
      <div key={module.id} className="space-y-2">
        <div
          className={cn(
            "flex min-h-10 items-center justify-between gap-3 rounded-md border px-3 py-2",
            selectedCount > 0
              ? "border-primary/25 bg-primary/10"
              : "border-border bg-muted/50",
          )}
          style={{
            marginLeft: `${depth * 28}px`,
            width: `calc(100% - ${depth * 28}px)`,
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            {hasChildren && (
              <span className="text-xs text-muted-foreground">v</span>
            )}
            <Checkbox
              checked={fullySelected}
              onCheckedChange={() =>
                hasChildren
                  ? toggleTreePermissions([module])
                  : toggleModulePermissions(
                      module.id,
                      module.features.map((feature) => feature.key),
                    )
              }
            />
            <span className="truncate text-sm font-medium">{module.label}</span>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {selectedCount}/{totalCount}
          </span>
        </div>

        {hasChildren && (
          <div className="space-y-2">
            {module.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}

        {!hasChildren &&
          module.features.length > 0 &&
          renderPermissionActions(module, depth + 1)}
      </div>
    );
  };

  if (isAuthLoading || (isEditMode && isLoadingRole)) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isEditMode && !role && !isLoadingRole) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] space-y-4">
        <p className="text-muted-foreground">Role not found</p>
        <Button onClick={() => navigate(backTo)}>Back to Roles</Button>
      </div>
    );
  }

  const isLoading = isCreating || isUpdating;

  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(backTo)}
              className="rounded-full shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {isEditMode ? "Edit Role" : "Create Role"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Name the role, then choose access from the same menu tree users
                see in the sidebar.
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => navigate(backTo)}>
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit(handleSubmit)}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditMode ? "Save Changes" : "Create Role"}
            </Button>
          </div>
        </div>

        {/* Role Details Card */}
        <Card>
          <CardHeader className="pb-3">
            {/* <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Role Details
                        </CardTitle> */}
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Role Name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Marketing Manager"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What should this role be allowed to do?"
                {...register("description")}
                className="min-h-[72px] resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="permissions" className="space-y-4">
          <TabsList className="h-8 justify-start rounded-md bg-muted p-1">
            <TabsTrigger
              value="permissions"
              className="h-6 rounded px-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Permissions
            </TabsTrigger>
            <TabsTrigger value="users" className="h-6 rounded px-3 text-xs">
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="mt-0">
            <div className="rounded-md border bg-background">
              <div className="flex flex-col gap-3 border-b p-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Search permissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-full md:w-72"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {permissionStats.selected} of {permissionStats.total}{" "}
                    selected
                  </span>
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${permissionStats.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {errors.permissions && (
                <p className="px-3 pt-3 text-sm text-destructive">
                  {errors.permissions.message}
                </p>
              )}

              <div className="grid min-h-[520px] md:grid-cols-[180px_1fr]">
                <aside className="border-b p-3 md:border-b-0 md:border-r">
                  <div className="space-y-1">
                    {visiblePermissionTree.map((module) => {
                      const selectedCount = getTreeSelectedCount(module);
                      const active = selectedRoot?.id === module.id;

                      return (
                        <button
                          key={module.id}
                          type="button"
                          onClick={() => setSelectedRootId(module.id)}
                          className={cn(
                            "flex h-8 w-full items-center justify-between rounded-md px-3 text-left text-sm transition-colors",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                        >
                          <span className="truncate">{module.label}</span>
                          {selectedCount > 0 && (
                            <span
                              className={cn(
                                "text-xs",
                                active ? "text-primary-foreground" : "text-primary",
                              )}
                            >
                              {selectedCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <div className="overflow-auto p-4">
                  {selectedRoot ? (
                    <div className="max-w-3xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold">
                            {selectedRoot.label}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {getTreeSelectedCount(selectedRoot)}/
                            {getTreePermissionKeys(selectedRoot).length}{" "}
                            permissions selected
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => toggleTreePermissions([selectedRoot])}
                        >
                          {isTreeFullySelected(selectedRoot)
                            ? "Deselect All"
                            : "Select All"}
                        </Button>
                      </div>
                      {renderTreeNode(selectedRoot)}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <Shield className="h-10 w-10 mb-3 opacity-20" />
                      <p className="font-medium">
                        {searchQuery
                          ? "No matching permissions"
                          : "No permissions available"}
                      </p>
                      <p className="text-sm">
                        Try another module or action name.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <div className="rounded-md border bg-background p-6 text-sm text-muted-foreground">
              Assign users after the role is created.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
