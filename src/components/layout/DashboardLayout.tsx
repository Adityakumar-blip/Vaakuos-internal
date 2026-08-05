import { ReactNode, useState } from "react";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sidebar } from "./Sidebar";
import { useTheme } from "@/context/ThemeContext";
import { useSpotlight } from "@/context/SpotlightContext";
import { EnhancedScrollArea } from "../elastic-scrollbar/ElasticScrollbar";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KEYBOARD_SHORTCUTS } from "@/lib/keyboardShortcuts";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { theme, toggleTheme, setTheme, setPalette, setDirection } = useTheme();
  const { open } = useSpotlight();
  const isDarkMode = theme === "dark";
  const user = useAppSelector(selectCurrentUser);
  const { logout } = useAuth();

  useKeyboardShortcuts({
    [KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR]: () => setSidebarExpanded((prev) => !prev),
  });

  const handleLogout = () => {
    setTheme("light");
    setPalette("green");
    setDirection("ltr");
    localStorage.removeItem("admin-theme");
    localStorage.removeItem("admin-palette");
    localStorage.removeItem("admin-direction");
    logout();
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-sidebar text-foreground">
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
        />

        <div className="flex flex-1 flex-col overflow-hidden bg-background lg:my-2 lg:rounded-l-2xl">
          <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background px-4 lg:rounded-tl-2xl lg:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Icons.Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>

            <div className="flex-1 flex items-center">
              <button
                onClick={open}
                className="inline-flex items-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground px-4 py-2 relative h-9 w-full max-w-[280px] justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12"
              >
                <Icons.Search className="h-4 w-4 mr-2" />
                <span>Search...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
                  {isDarkMode ? (
                    <Icons.Sun className="h-5 w-5" />
                  ) : (
                    <Icons.Moon className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isDarkMode ? "Light Mode" : "Dark Mode"}</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer ml-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary hover:ring-2 ring-primary/20 transition-all shadow-sm">
                    <span className="text-sm font-semibold text-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() || "A"}
                    </span>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <Icons.Logout className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            <EnhancedScrollArea className="flex-1">
              <main className="px-4 lg:px-6 pt-4 lg:pt-6 pb-3 lg:pb-4">{children}</main>
            </EnhancedScrollArea>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
