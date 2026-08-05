import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Icons } from "@/components/Icons";

import { cn } from "@/lib/utils";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & { error?: string }
>(({ className, error, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    <motion.div
       animate={error ? { x: [-2, 2, -2, 2, 0] } : {}}
       transition={{ duration: 0.3 }}
       className="relative flex items-center justify-center p-1 -m-1"
    >
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          error && "border-destructive ring-2 ring-destructive ring-offset-1 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
          className,
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
          <Icons.Check className="h-4 w-4" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </motion.div>
    
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -5 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="text-[11px] font-medium text-destructive flex items-start px-1 relative -left-1"
        >
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
