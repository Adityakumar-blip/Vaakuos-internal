import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import * as HeroIcons from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { useModules } from '@/hooks/useModules';
import { useAdminType } from '@/hooks/useAdminType';
import { ModuleConfig } from '@/types/admin.types';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import vaakuos from "@/assets/white_full.png";


// Map Lucide icon names to Heroicons names
const ICON_MAP: Record<string, React.ComponentType<React.ComponentProps<'svg'>>> = {
    'LayoutDashboard': HeroIcons.Squares2X2Icon,
    'Users': HeroIcons.UsersIcon,
    'User': HeroIcons.UserIcon,
    'Shield': HeroIcons.ShieldCheckIcon,
    'MessageCircle': HeroIcons.ChatBubbleLeftRightIcon,
    'FileText': HeroIcons.DocumentTextIcon,
    'Webhook': HeroIcons.ArrowsRightLeftIcon,
    'CreditCard': HeroIcons.CreditCardIcon,
    'FileCheck': HeroIcons.DocumentCheckIcon,
    'Settings': HeroIcons.Cog6ToothIcon,
    'AlertTriangle': HeroIcons.ExclamationTriangleIcon,
    'Bell': HeroIcons.BellIcon,
    'Building': HeroIcons.BuildingOfficeIcon,
    'Palette': HeroIcons.PaintBrushIcon,
    'BarChart': HeroIcons.ChartBarIcon,
    'Briefcase': HeroIcons.BriefcaseIcon,
    'Calendar': HeroIcons.CalendarIcon,
    'Ticket': HeroIcons.TicketIcon,
    'HelpCircle': HeroIcons.QuestionMarkCircleIcon,
    'Database': HeroIcons.ServerIcon,
    'Zap': HeroIcons.BoltIcon,
    'Activity': HeroIcons.PresentationChartLineIcon,
    'AlertOctagon': HeroIcons.ExclamationCircleIcon,
    'LayoutTemplate': HeroIcons.RectangleGroupIcon,
    'Circle': HeroIcons.CircleStackIcon
};

export function DynamicSidebar() {
    const { collapsed, toggleCollapsed, isExpanded } = useSidebar();
    const location = useLocation();
    const { user } = useAuth();
    const { direction } = useTheme();
    const { modules } = useModules();
    const { getAdminTypeLabel } = useAdminType();

    const isRtl = direction === 'rtl';
    const [openMenus, setOpenMenus] = React.useState<string[]>([]);

    const toggleMenu = (id: string) => {
        setOpenMenus(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    React.useEffect(() => {
        modules.forEach(module => {
            if (module.children) {
                const isActiveChild = module.children.some(child =>
                    location.pathname === child.path || location.pathname.startsWith(`${child.path}/`)
                );

                if (isActiveChild) {
                    setOpenMenus(prev => {
                        if (prev.includes(module.id)) return prev;
                        return [...prev, module.id];
                    });
                }
            }
        });
    }, [location.pathname, modules]);

    // Get icon component from string name
    const getIcon = (iconName: string): React.ReactNode => {
        // Try direct lookup first (using updated names in modules.config.ts)
        let IconComponent = (HeroIcons as unknown as Record<string, React.ComponentType<React.ComponentProps<'svg'>>>)[iconName];

        // Fallback to ICON_MAP for any legacy names or special mappings
        if (!IconComponent) {
            IconComponent = ICON_MAP[iconName] || HeroIcons.QuestionMarkCircleIcon;
        }

        return <IconComponent className="w-5 h-5" />;
    };

    const renderModule = (module: ModuleConfig) => {
        const isActive = location.pathname === module.path;
        const hasChildren = module.children && module.children.length > 0;
        const isOpen = openMenus.includes(module.id);

        if (hasChildren) {
            return (
                <div key={module.id} className="space-y-1">
                    {isExpanded ? (
                        <div
                            onClick={() => toggleMenu(module.id)}
                            className={cn(
                                'flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer',
                                isOpen ? 'text-sidebar-foreground' : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className="shrink-0">{getIcon(module.icon)}</span>
                                <span className={cn('whitespace-nowrap transition-all duration-300', isExpanded ? 'opacity-100' : 'opacity-0 w-0')}>
                                    {module.name}
                                </span>
                            </div>
                            <ChevronDownIcon
                                className={cn('w-4 h-4 transition-transform duration-200', isOpen ? 'rotate-180' : '')}
                            />
                        </div>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className="flex items-center justify-center py-2.5 rounded-lg text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
                                >
                                    {getIcon(module.icon)}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side={isRtl ? "left" : "right"} className="p-0 min-w-[200px]">
                                <div className="py-2">
                                    <div className="px-3 py-2 text-sm font-semibold text-sidebar-foreground border-b border-sidebar-border/50">
                                        {module.name}
                                    </div>
                                    <div className="py-1 space-y-0.5">
                                        {module.children!.map((child) => (
                                            <NavLink
                                                key={child.id}
                                                to={child.path}
                                                className={({ isActive }) => cn(
                                                    'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                                                    isActive
                                                        ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                                                        : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                                                )}
                                            >
                                                <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                                                {child.name}
                                            </NavLink>
                                        ))}
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* Submenu */}
                    {isOpen && isExpanded && (
                        <div className="ml-9 space-y-1 text-sm border-l border-sidebar-border/50 pl-2">
                            {module.children!.map((child) => (
                                <NavLink
                                    key={child.id}
                                    to={child.path}
                                    className={({ isActive }) => cn(
                                        'block px-3 py-2 rounded-lg transition-colors truncate',
                                        isActive
                                            ? 'bg-sidebar-accent/50 text-sidebar-foreground font-medium'
                                            : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/30'
                                    )}
                                >
                                    {child.name}
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        const LinkContent = (
            <NavLink
                to={module.path}
                className={cn(
                    'flex items-center px-3 py-2.5 rounded-lg transition-colors group relative',
                    isExpanded ? 'gap-3' : 'justify-center',
                    isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
            >
                <span className="shrink-0">{getIcon(module.icon)}</span>
                <span
                    className={cn(
                        'whitespace-nowrap transition-all duration-300',
                        isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                    )}
                >
                    {module.name}
                </span>
                {!isExpanded && (
                    <div className="absolute inset-0" />
                )}
            </NavLink>
        );

        if (isExpanded) {
            return <React.Fragment key={module.id}>{LinkContent}</React.Fragment>;
        }

        return (
            <Tooltip key={module.id}>
                <TooltipTrigger asChild>
                    {LinkContent}
                </TooltipTrigger>
                <TooltipContent side={isRtl ? "left" : "right"}>
                    {module.name}
                </TooltipContent>
            </Tooltip>
        );
    };

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    'fixed top-0 h-screen bg-sidebar border-sidebar-border z-40 transition-all duration-300 ease-in-out flex flex-col',
                    isRtl ? 'right-0 border-l' : 'left-0 border-r',
                    isExpanded ? 'w-64' : 'w-16'
                )}
            >
                {/* Logo & Admin Type */}
               <div className="h-16 border-b border-sidebar-border flex items-center px-3 gap-2">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary shadow-sm shrink-0 hover:scale-[1.02] transition-transform cursor-pointer">
            <img src={vaakuos} alt="vaakuos logo" />
          </div>
          <span
            className={cn(
              "text-lg font-semibold text-sidebar-foreground whitespace-nowrap transition-opacity duration-200",
              !collapsed ? "opacity-100" : "opacity-0 lg:w-0"
            )}
          >
            VaakuOS
          </span>
        </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto stealth-scroll">
                    {modules.map(renderModule)}
                </nav>

                {/* Footer Section: User Info & Collapse Toggle */}
                <div className="border-t border-sidebar-border p-2 space-y-1">


                    {/* Collapse Toggle */}
                    <button
                        onClick={toggleCollapsed}
                        className={cn(
                            "w-full flex items-center p-2 rounded-lg text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group",
                            isExpanded ? "gap-3" : "justify-center"
                        )}
                    >
                        <div className="shrink-0 flex items-center justify-center w-5 h-5">
                            {/* Double Chevron that rotates */}
                            <div className={cn("transition-transform duration-300", collapsed ? "rotate-180" : "rotate-0")}>
                                {isRtl ? <ChevronDoubleRightIcon className="w-5 h-5" /> : <ChevronDoubleLeftIcon className="w-5 h-5" />}
                            </div>
                        </div>
                        <span
                            className={cn(
                                'whitespace-nowrap transition-all duration-300 text-sm font-medium',
                                isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                            )}
                        >
                            Collapse
                        </span>
                    </button>
                </div>
            </aside>
        </TooltipProvider>
    );
}
