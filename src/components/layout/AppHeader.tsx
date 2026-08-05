import React from 'react';
import {
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  LanguageIcon,
  SwatchIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { availablePalettes } from '@/config/settings-registry';
import { useAuth } from '@/context/AuthContext';
import { useSpotlight } from '@/context/SpotlightContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function AppHeader() {
  const navigate = useNavigate();
  const { theme, toggleTheme, palette, setPalette, direction, toggleDirection } = useTheme();
  const { user, logout } = useAuth();
  const { open: openSpotlight } = useSpotlight();

  const isRtl = direction === 'rtl';

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="h-full flex items-center justify-between px-4 gap-4">
        {/* Left Actions */}
        <div className="flex items-center gap-4 flex-1">
          {/* Search Trigger */}
          <button
            onClick={openSpotlight}
            className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors min-w-[200px] lg:min-w-[280px]"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            <span className="text-sm">Search...</span>
            <kbd className={cn('hidden sm:inline-flex px-1.5 py-0.5 text-xs font-mono bg-background rounded border border-border', isRtl ? 'mr-auto' : 'ml-auto')}>
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* RTL Toggle */}
          <button
            onClick={toggleDirection}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title={`Switch to ${direction === 'ltr' ? 'RTL' : 'LTR'}`}
          >
            <LanguageIcon className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} mode`}
          >
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </button>

          {/* Palette Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <SwatchIcon className="w-5 h-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-40">
              <DropdownMenuLabel>Color Palette</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availablePalettes.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => setPalette(p.id)}
                  className={cn(palette === p.id && 'bg-muted')}
                >
                  <style dangerouslySetInnerHTML={{ __html: `.palette-preview-${p.id} { background-color: hsl(${p.hsl}); }` }} />
                  <div className={`w-4 h-4 rounded-full mr-2 palette-preview-${p.id}`} />
                  {p.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user?.name.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-start">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
