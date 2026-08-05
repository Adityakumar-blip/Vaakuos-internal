import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, ...props }, ref) => {
  return (
    <div className="w-full flex flex-col gap-1">
      <motion.div
         animate={error ? { x: [-2, 2, -2, 2, 0] } : {}}
         transition={{ duration: 0.3 }}
         className="relative"
      >
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border bg-background text-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
            error 
              ? "border-destructive/60 bg-destructive/5 focus-visible:ring-destructive/30 hover:border-destructive text-destructive pr-10 shadow-[0_0_10px_rgba(239,68,68,0.05)]" 
              : "border-input focus-visible:ring-primary/20 hover:border-primary/50",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <div className="absolute right-3 top-3 text-destructive pointer-events-none">
             <AlertCircle className="h-4 w-4" />
          </div>
        )}
      </motion.div>
      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -5 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="text-[11px] font-medium text-destructive flex items-start px-1"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
