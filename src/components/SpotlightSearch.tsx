import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Squares2X2Icon as LayoutDashboard,
    UsersIcon as Users,
    BuildingOffice2Icon as Building2,
    Cog6ToothIcon as Settings,
    UserIcon as User,
    MagnifyingGlassIcon as Search,
    SunIcon as Sun,
    MoonIcon as Moon,
    LanguageIcon as Languages,
    PlusIcon as Plus,
    SwatchIcon as Palette,
    PuzzlePieceIcon as Component,
    ShieldCheckIcon as Shield,
} from '@heroicons/react/24/outline';
import * as Icons from '@heroicons/react/24/outline';
import { useSpotlight } from '@/context/SpotlightContext';
import { useTheme } from '@/context/ThemeContext';
import { useModules } from '@/hooks/useModules';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ModuleConfig } from '@/types/admin.types';
import { platformNavigation } from '@/config/platformNavigation';

interface SpotlightItem {
    id: string;
    label: string;
    description?: string;
    icon: React.ReactNode;
    type: 'page' | 'action' | 'user' | 'tenant';
    action?: () => void;
    route?: string;
}

// Helper to get icon component from string name
const getIconComponent = (iconName: string): React.ReactNode => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<{ className?: string }> | undefined;
    return IconComponent ? <IconComponent className="w-5 h-5" /> : <Component className="w-5 h-5" />;
};

// Convert modules to spotlight items recursively
const moduleToSpotlightItems = (modules: ModuleConfig[], parentLabel?: string): SpotlightItem[] => {
    const items: SpotlightItem[] = [];

    modules.forEach(module => {
        const label = parentLabel ? `${parentLabel} > ${module.name}` : module.name;

        items.push({
            id: module.id,
            label,
            description: `Navigate to ${module.name}`,
            icon: getIconComponent(module.icon),
            type: 'page',
            route: module.path,
        });

        // Recursively add children
        if (module.children && module.children.length > 0) {
            items.push(...moduleToSpotlightItems(module.children, module.name));
        }
    });

    return items;
};

export function SpotlightSearch() {
    const { isOpen, close } = useSpotlight();
    const { toggleTheme, theme, toggleDirection, direction, setPalette } = useTheme();
    const { modules } = useModules();
    const { user, hasPermission } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Generate spotlight items conditionally based on app vs admin context
    const isAdminMode = location.pathname.startsWith('/admin');
    const spotlightItems = useMemo(() => {
        if (isAdminMode) {
            return moduleToSpotlightItems(modules);
        }
        return platformNavigation
            .filter(item => !item.permission || hasPermission(item.permission))
            .map(item => ({
                id: item.href,
                label: item.name,
                description: `Navigate to ${item.name}`,
                icon: <item.icon className="w-5 h-5" />,
                type: 'page' as const,
                route: item.href,
            }));
    }, [modules, isAdminMode, hasPermission]);

    const actionItems: SpotlightItem[] = useMemo(() => {
        const actions: SpotlightItem[] = [
            { id: 'toggle-theme', label: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`, icon: theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />, type: 'action', action: toggleTheme },
            { id: 'toggle-rtl', label: `Switch to ${direction === 'ltr' ? 'RTL' : 'LTR'}`, icon: <Languages className="w-5 h-5" />, type: 'action', action: toggleDirection },
            { id: 'palette-green', label: 'Set Green Palette', icon: <Palette className="w-5 h-5" />, type: 'action', action: () => setPalette('green') },
            { id: 'palette-blue', label: 'Set Blue Palette', icon: <Palette className="w-5 h-5" />, type: 'action', action: () => setPalette('blue') },
            { id: 'palette-violet', label: 'Set Violet Palette', icon: <Palette className="w-5 h-5" />, type: 'action', action: () => setPalette('violet') },
        ];

        // Add admin-type specific create actions dynamically based on current route
        const pathParts = location.pathname.split('/');
        let currentAdminType = null;
        if (pathParts[1] === 'admin' && ['owner', 'brand', 'agency'].includes(pathParts[2])) {
            currentAdminType = pathParts[2];
        }

        if (currentAdminType === 'owner') {
            actions.push(
                { id: 'create-user', label: 'Create User', description: 'Add a new user', icon: <Plus className="w-5 h-5" />, type: 'action', action: () => navigate('/team/user/create') },
                { id: 'create-role', label: 'Create Role', description: 'Create a new role', icon: <Plus className="w-5 h-5" />, type: 'action', action: () => navigate('/team/role/create') },
                { id: 'create-subscription', label: 'Create Subscription', description: 'Add a new subscription plan', icon: <Plus className="w-5 h-5" />, type: 'action', action: () => navigate('/subscription/create') },
                { id: 'create-coupon', label: 'Create Coupon', description: 'Generate a new coupon', icon: <Plus className="w-5 h-5" />, type: 'action', action: () => navigate('/coupon/create') },
                { id: 'create-faq', label: 'Create FAQ', description: 'Add a new FAQ', icon: <Plus className="w-5 h-5" />, type: 'action', action: () => navigate('/faq/create') },
                { id: 'create-master', label: 'Create Master Data', description: 'Add master data item', icon: <Plus className="w-5 h-5" />, type: 'action', action: () => navigate('/master/create') },
            );
        } else if (currentAdminType === 'brand') {
            actions.push(
                { id: 'create-user', label: 'Create User', description: 'Add a new user', icon: <Plus className="w-5 h-5" />, type: 'action', action: () => navigate('/admin/brand/team/user/create') },
                { id: 'create-role', label: 'Create Role', description: 'Create a new role', icon: <Plus className="w-5 h-5" />, type: 'action', action: () => navigate('/admin/brand/team/role/create') },
            );
        } else if (currentAdminType === 'agency') {
            actions.push(
                { id: 'create-user', label: 'Create User', description: 'Add a new user', icon: <Plus className="w-5 h-5" />, type: 'action', action: () => navigate('/admin/agency/team/user/create') },
                { id: 'create-role', label: 'Create Role', description: 'Create a new role', icon: <Plus className="w-5 h-5" />, type: 'action', action: () => navigate('/admin/agency/team/role/create') },
            );
        }

        return actions;
    }, [theme, direction, toggleTheme, toggleDirection, navigate, setPalette, location.pathname]);

    const allItems = useMemo(() => [...spotlightItems, ...actionItems], [spotlightItems, actionItems]);

    const filteredItems = useMemo(() => {
        if (!query.trim()) return allItems;
        const lowerQuery = query.toLowerCase();
        return allItems.filter(
            (item) =>
                item.label.toLowerCase().includes(lowerQuery) ||
                item.description?.toLowerCase().includes(lowerQuery)
        );
    }, [query, allItems]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredItems]);

    const executeItem = useCallback((item: SpotlightItem) => {
        if (item.action) {
            item.action();
        } else if (item.route) {
            navigate(item.route);
        }
        close();
    }, [navigate, close]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
            e.preventDefault();
            executeItem(filteredItems[selectedIndex]);
        }
    };

    useEffect(() => {
        if (listRef.current) {
            const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
            selectedEl?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            <div
                className="fixed inset-0 bg-foreground/20 backdrop-blur-sm animate-fade-in"
                onClick={close}
            />
            <div className="relative z-10 w-full max-w-xl mx-4 bg-popover rounded-xl shadow-xl border border-border overflow-hidden animate-scale-in">
                {/* Search Input */}
                <div className="flex items-center px-4 border-b border-border">
                    <Search className="text-muted-foreground w-5 h-5" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search pages, actions, commands..."
                        className="flex-1 px-3 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-mono bg-muted rounded text-muted-foreground">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
                    {filteredItems.length === 0 ? (
                        <div className="px-4 py-8 text-center text-muted-foreground">
                            No results found for "{query}"
                        </div>
                    ) : (
                        filteredItems.map((item, index) => (
                            <button
                                key={item.id}
                                onClick={() => executeItem(item)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-start transition-colors',
                                    index === selectedIndex
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                )}
                            >
                                <div className={cn(
                                    'flex items-center justify-center w-8 h-8 rounded-lg',
                                    index === selectedIndex ? 'bg-primary-foreground/20' : 'bg-muted'
                                )}>
                                    {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{item.label}</div>
                                    {item.description && (
                                        <div className={cn(
                                            'text-sm truncate',
                                            index === selectedIndex ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                        )}>
                                            {item.description}
                                        </div>
                                    )}
                                </div>
                                <span className={cn(
                                    'text-xs px-2 py-0.5 rounded capitalize',
                                    index === selectedIndex
                                        ? 'bg-primary-foreground/20 text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                )}>
                                    {item.type}
                                </span>
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">↑</kbd>
                            <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">↓</kbd>
                            to navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">↵</kbd>
                            to select
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">⌘</kbd>
                        <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">K</kbd>
                        to toggle
                    </span>
                </div>
            </div>
        </div>
    );
}
