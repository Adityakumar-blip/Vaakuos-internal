import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

const EnhancedScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [overscrollTop, setOverscrollTop] = React.useState(false);
  const [overscrollBottom, setOverscrollBottom] = React.useState(false);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout>();
  const viewportRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = React.useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    // Show scrollbar when scrolling
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Only update overscroll state if it actually changes to minimize re-renders
    const isAtTop = scrollTop <= 0;
    const isAtBottom = Math.abs(scrollTop + clientHeight - scrollHeight) < 1;

    setOverscrollTop(prev => prev !== isAtTop ? isAtTop : prev);
    setOverscrollBottom(prev => prev !== isAtBottom ? isAtBottom : prev);

    // Hide scrollbar after 1 second of no scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      setOverscrollTop(false);
      setOverscrollBottom(false);
    }, 1000);
  }, []);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        viewport.removeEventListener("scroll", handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [handleScroll]);

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        className={cn(
          "h-full w-full rounded-[inherit]",
          // Only apply transition and animation when overscrolling to avoid jitter during normal scroll
          (overscrollTop || overscrollBottom) && "transition-transform duration-300 ease-out",
          overscrollTop && "animate-[stretch-top_0.3s_ease-out]",
          overscrollBottom && "animate-[stretch-bottom_0.3s_ease-out]"
        )}
        style={{ 
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          perspective: 1000,
          WebkitFontSmoothing: 'antialiased'
        }}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <EnhancedScrollBar isVisible={isScrolling} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});
EnhancedScrollArea.displayName = "EnhancedScrollArea";

interface EnhancedScrollBarProps
  extends React.ComponentPropsWithoutRef<
    typeof ScrollAreaPrimitive.ScrollAreaScrollbar
  > {
  isVisible?: boolean;
}

const EnhancedScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  EnhancedScrollBarProps
>(({ className, orientation = "vertical", isVisible = false, ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-all duration-300",
      orientation === "vertical" && "h-full w-1.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-1.5 flex-col border-t border-t-transparent p-[1px]",
      isVisible ? "opacity-100" : "opacity-0",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border/60 hover:bg-border transition-colors" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
EnhancedScrollBar.displayName = "EnhancedScrollBar";

export { EnhancedScrollArea, EnhancedScrollBar };
