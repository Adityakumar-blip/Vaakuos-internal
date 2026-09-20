import { Icons } from "@/components/Icons";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import * as HeroIcons from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { PanelLeft } from "lucide-react";


import vaakuos from "@/assets/white_full.png";
import vaakuosDark from "@/assets/black_full.png";
import { useModules } from "@/hooks/useModules";
import { ModuleConfig } from "@/types/admin.types";
import React from "react";

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
}



/** Resolve a Heroicons icon string to a React component */
function getHeroIcon(
  iconName: string
): React.ComponentType<React.ComponentProps<"svg">> {
  const IconComponent = (
    HeroIcons as unknown as Record<
      string,
      React.ComponentType<React.ComponentProps<"svg">>
    >
  )[iconName];
  return IconComponent || HeroIcons.QuestionMarkCircleIcon;
}

export function Sidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
  sidebarExpanded,
  setSidebarExpanded,
}: SidebarProps) {
  const location = useLocation();
  const { modules: adminModules } = useModules();

  // On small screens, we always want the sidebar to be "expanded" (show labels) 
  // when it's opened via the mobile menu drawer.
  const isActuallyExpanded = sidebarExpanded || mobileMenuOpen;

  // --- Admin module rendering ---
  const [openMenus, setOpenMenus] = React.useState<string[]>([]);

  React.useEffect(() => {
    adminModules.forEach((module) => {
      if (module.children) {
        const isActiveChild = module.children.some(
          (child) =>
            location.pathname === child.path ||
            location.pathname.startsWith(`${child.path}/`)
        );
        if (isActiveChild) {
          setOpenMenus((prev) =>
            prev.includes(module.id) ? prev : [...prev, module.id]
          );
        }
      }
    });
  }, [location.pathname, adminModules]);



  // Group order follows each group's first appearance in the module config.
  const moduleGroups = React.useMemo(() => {
    const grouped = new Map<string, ModuleConfig[]>();
    adminModules.forEach((module) => {
      const key = module.group ?? "";
      grouped.set(key, [...(grouped.get(key) ?? []), module]);
    });
    return [...grouped];
  }, [adminModules]);

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const renderAdminModule = (module: ModuleConfig) => {
    const isModuleActive = location.pathname === module.path;
    const hasChildren = module.children && module.children.length > 0;
    const isOpen = openMenus.includes(module.id);
    const IconComp = getHeroIcon(module.icon);

    if (hasChildren) {
      if (!isActuallyExpanded) {
        return (
          <Tooltip key={module.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center w-full px-2 py-2 rounded-md transition-all duration-200 cursor-pointer text-sidebar-foreground hover:bg-sidebar-hover">
                <IconComp className="h-5 w-5 shrink-0" />
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              align="start"
              sideOffset={10}
              className="p-0 min-w-[200px]"
            >
              <div className="py-2">
                <div className="px-3 py-2 text-sm font-semibold text-sidebar-foreground border-b border-sidebar-border/50">
                  {module.name}
                </div>
                <div className="py-1 space-y-0.5">
                  {module.children!.map((child) => {
                    const isExactMatch = location.pathname === child.path;
                    const isSubPathMatch = location.pathname.startsWith(`${child.path}/`);
                    let isChildActive = isExactMatch || isSubPathMatch;

                    if (child.path === module.path && !isExactMatch) {
                      const anotherChildMatches = module.children!.some(
                        (c) => c.id !== child.id && (location.pathname === c.path || location.pathname.startsWith(`${c.path}/`))
                      );
                      if (anotherChildMatches) isChildActive = false;
                    }

                    return (
                      <NavLink
                        key={child.id}
                        to={child.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                          isChildActive
                            ? "bg-sidebar-active text-sidebar-foreground font-medium"
                            : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover"
                        )}
                      >
                        <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                        {child.name}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      }

      return (
        <div key={module.id} className="space-y-0.5">
          <div
            onClick={() => toggleMenu(module.id)}
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-md text-sidebar-foreground hover:bg-sidebar-hover transition-all duration-200 cursor-pointer",
              isOpen && "text-sidebar-foreground bg-sidebar-hover"
            )}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <IconComp className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {module.name}
              </span>
            </div>
            <ChevronDownIcon
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200 opacity-60",
                isOpen && "rotate-180 opacity-100"
              )}
            />
          </div>

          {isOpen && isActuallyExpanded && (
            <div className="ml-9 space-y-0.5 border-l border-sidebar-border pl-2 my-1">
              {module.children!.map((child) => {
                const isExactMatch = location.pathname === child.path;
                const isSubPathMatch = location.pathname.startsWith(`${child.path}/`);
                let isChildActive = isExactMatch || isSubPathMatch;

                if (child.path === module.path && !isExactMatch) {
                  const anotherChildMatches = module.children!.some(
                    (c) => c.id !== child.id && (location.pathname === c.path || location.pathname.startsWith(`${c.path}/`))
                  );
                  if (anotherChildMatches) isChildActive = false;
                }

                return (
                  <NavLink
                    key={child.id}
                    to={child.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-3 py-2 rounded-md text-sm transition-all duration-200",
                      isChildActive
                        ? "bg-sidebar-active/70 font-semibold text-sidebar-foreground"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-hover/50"
                    )}
                  >
                    {child.name}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Tooltip key={module.id}>
        <TooltipTrigger asChild>
          <NavLink
            to={module.path}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-hover transition-all duration-200 hover:scale-[1.01]",
              !isActuallyExpanded && "justify-center px-2",
              isModuleActive && "bg-sidebar-active font-semibold shadow-sm"
            )}
          >
            <IconComp className="h-5 w-5 shrink-0" />
            {isActuallyExpanded && (
              <span className="text-sm font-medium whitespace-nowrap">
                {module.name}
              </span>
            )}
          </NavLink>
        </TooltipTrigger>
        {!isActuallyExpanded && (
          <TooltipContent side="right" className="font-medium hidden lg:block">
            {module.name}
          </TooltipContent>
        )}
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col lg:border-r-0",
          "lg:relative",
          mobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
          "lg:translate-x-0",
          sidebarExpanded ? "lg:w-64" : "lg:w-16"
        )}
      >
        {/* Collapsed rail is 64px wide — only the toggle fits, so the brand row
            yields to it. */}
        <div className="h-16 flex items-center px-2 gap-1">
          <div
            className={cn(
              "flex min-w-0 flex-1 items-center gap-1 px-1",
              !isActuallyExpanded && "hidden"
            )}
          >
            <div className="h-10 w-10 shrink-0 flex items-center justify-center overflow-hidden">
              <img src={vaakuosDark} alt="VaakuOS" className="dark:hidden" />
              <img src={vaakuos} alt="VaakuOS" className="hidden dark:block" />
            </div>
            {isActuallyExpanded && (
              <span className="truncate text-lg font-semibold leading-tight text-sidebar-foreground">
                VaakuOS
              </span>
            )}
          </div>
          {isActuallyExpanded && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-sidebar-foreground hover:bg-sidebar-hover rounded-md lg:hidden"
            >
              <Icons.Close className="h-5 w-5" />
            </button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className={cn(
                  "hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground",
                  !isActuallyExpanded && "mx-auto"
                )}
              >
                <PanelLeft className="h-[18px] w-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium hidden lg:block">
              {sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        {isActuallyExpanded && (
          <div className="px-4 pt-4 pb-1">
            <p className="text-sm font-semibold text-sidebar-foreground">
              Internal Console
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
              Platform Team
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 stealth-scroll pt-2 pb-4">
          {moduleGroups.map(([group, modules], index) => (
            <div key={group || index} className={cn("space-y-1", index > 0 && "mt-4")}>
              {group &&
                (isActuallyExpanded ? (
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                    {group}
                  </p>
                ) : (
                  <div className="mx-2 mb-2 border-t border-sidebar-border" />
                ))}
              {modules.map(renderAdminModule)}
            </div>
          ))}
        </nav>

      </aside>
    </TooltipProvider>
  );
}
