import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
const Circle = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="4" />
  </svg>
);

import { cn } from "@/lib/utils";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & { error?: string }
>(({ className, error, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <motion.div
         animate={error ? { x: [-2, 2, -2, 2, 0] } : {}}
         transition={{ duration: 0.3 }}
         className={cn("relative p-1 -m-1 rounded-md", error && "ring-2 ring-destructive ring-offset-2 shadow-[0_0_10px_rgba(239,68,68,0.15)]")}
      >
        <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} ref={ref} />
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
            <AlertCircle className="w-3 h-3 mr-1 inline-block" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
