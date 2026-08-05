import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { XMarkIcon as X, PlusIcon as Plus, CheckIcon as Check, ExclamationCircleIcon as AlertCircle, ClockIcon as Clock, ArrowPathIcon as Loader2 } from "@heroicons/react/24/outline";

import { cn } from "@/lib/utils";

const tagVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20",
        secondary: "bg-secondary text-secondary-foreground border border-secondary/20 hover:bg-secondary/80",
        destructive: "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        success: "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20",
        warning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20",
        info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20",
      },
      size: {
        sm: "text-xs px-2 py-0.5 gap-1",
        default: "text-xs px-2.5 py-1 gap-1.5",
        lg: "text-sm px-3 py-1.5 gap-2",
      },
      status: {
        none: "",
        pending: "opacity-70",
        active: "",
        completed: "",
        error: "",
        loading: "opacity-80",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      status: "none",
    },
  }
);

export interface TagProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof tagVariants> {
  /** The text content of the tag */
  label?: string;
  /** Whether the tag can be removed */
  clearable?: boolean;
  /** Callback when the tag is removed */
  onClear?: () => void;
  /** Custom icon to display before the label */
  icon?: React.ReactNode;
  /** Whether to show status icon based on status prop */
  showStatusIcon?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  (
    {
      className,
      variant,
      size,
      status = "none",
      label,
      clearable = false,
      onClear,
      icon,
      showStatusIcon = false,
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    const getStatusIcon = () => {
      if (!showStatusIcon || status === "none") return null;

      const iconClass = "h-3 w-3";
      switch (status) {
        case "pending":
          return <Clock className={iconClass} />;
        case "active":
          return <Check className={iconClass} />;
        case "completed":
          return <Check className={iconClass} />;
        case "error":
          return <AlertCircle className={iconClass} />;
        case "loading":
          return <Loader2 className={cn(iconClass, "animate-spin")} />;
        default:
          return null;
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          tagVariants({ variant, size, status }),
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {icon && <span className="flex items-center">{icon}</span>}
        {getStatusIcon()}
        <span className="flex-1">{children || label}</span>
        {clearable && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear?.();
            }}
            className="flex items-center justify-center rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring transition-opacity"
            aria-label="Remove tag"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);
Tag.displayName = "Tag";

export interface TagInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Array of tag values */
  tags: string[];
  /** Callback when tags change */
  onChange: (tags: string[]) => void;
  /** Whether users can add new tags */
  addable?: boolean;
  /** Whether tags can be removed */
  clearable?: boolean;
  /** Placeholder text for input */
  placeholder?: string;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Tag variant */
  variant?: TagProps["variant"];
  /** Tag size */
  size?: TagProps["size"];
  /** Tag status */
  status?: TagProps["status"];
  /** Whether to show status icons */
  showStatusIcon?: boolean;
  /** Custom icon for tags */
  icon?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Custom validation function */
  validate?: (tag: string) => boolean;
  /** Callback when validation fails */
  onValidationError?: (tag: string) => void;
  /** Allow duplicate tags */
  allowDuplicates?: boolean;
  /** Custom render function for tags */
  renderTag?: (tag: string, index: number) => React.ReactNode;
}

const TagInput = React.forwardRef<HTMLDivElement, TagInputProps>(
  (
    {
      className,
      tags = [],
      onChange,
      addable = false,
      clearable = true,
      placeholder = "Add tag...",
      maxTags,
      variant = "default",
      size = "default",
      status = "none",
      showStatusIcon = false,
      icon,
      disabled = false,
      validate,
      onValidationError,
      allowDuplicates = false,
      renderTag,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState("");
    const [isAdding, setIsAdding] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleAddTag = () => {
      const trimmedValue = inputValue.trim();

      if (!trimmedValue) return;

      // Check max tags
      if (maxTags && tags.length >= maxTags) {
        return;
      }

      // Check duplicates
      if (!allowDuplicates && tags.includes(trimmedValue)) {
        setInputValue("");
        return;
      }

      // Custom validation
      if (validate && !validate(trimmedValue)) {
        onValidationError?.(trimmedValue);
        return;
      }

      onChange([...tags, trimmedValue]);
      setInputValue("");
      setIsAdding(false);
    };

    const handleRemoveTag = (index: number) => {
      onChange(tags.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      } else if (e.key === "Escape") {
        setInputValue("");
        setIsAdding(false);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap gap-2 p-2 rounded-md border border-input bg-background min-h-[42px]",
          disabled && "opacity-50 cursor-not-allowed bg-muted",
          className
        )}
        {...props}
      >
        {tags.map((tag, index) =>
          renderTag ? (
            <React.Fragment key={index}>{renderTag(tag, index)}</React.Fragment>
          ) : (
            <Tag
              key={index}
              label={tag}
              variant={variant}
              size={size}
              status={status}
              showStatusIcon={showStatusIcon}
              icon={icon}
              clearable={clearable}
              disabled={disabled}
              onClear={() => handleRemoveTag(index)}
            />
          )
        )}

        {addable && !disabled && (!maxTags || tags.length < maxTags) && (
          <>
            {isAdding ? (
              <div className="flex items-center gap-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    if (!inputValue.trim()) {
                      setIsAdding(false);
                    }
                  }}
                  placeholder={placeholder}
                  className="outline-none bg-transparent text-xs px-2 py-1 min-w-[100px] max-w-[200px]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="flex items-center justify-center h-5 w-5 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  aria-label="Add tag"
                >
                  <Check className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsAdding(true);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium border border-dashed border-input hover:border-primary hover:bg-primary/5 transition-all",
                  size === "sm" && "px-2 py-0.5 gap-1",
                  size === "lg" && "px-3 py-1.5 gap-2 text-sm"
                )}
                aria-label="Add new tag"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            )}
          </>
        )}
      </div>
    );
  }
);
TagInput.displayName = "TagInput";

export { Tag, TagInput, tagVariants };
