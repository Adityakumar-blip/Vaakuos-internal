import * as React from "react";
import { PlusIcon as Plus, XMarkIcon as X, CheckIcon as Check } from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface EnhancedTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
}

export function EnhancedTagInput({
  tags = [],
  onChange,
  suggestions = [],
  placeholder = "Add tag...",
  className,
}: EnhancedTagInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
    }
    setInputValue("");
    setOpen(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const filteredSuggestions = suggestions.filter(
    (suggestion) => !tags.includes(suggestion)
  );

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="pl-2 pr-1 py-1 gap-1 flex items-center bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
        >
          {tag}
          <button
            type="button"
            onClick={() => handleRemoveTag(tag)}
            className="hover:bg-primary/30 rounded-full p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-full border-dashed border-primary/50 text-primary hover:text-primary hover:border-primary hover:bg-primary/5"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0" align="start">
          <Command className="rounded-lg border shadow-md">
            <div className="flex items-center border-b px-3">
              <CommandInput
                placeholder={placeholder}
                value={inputValue}
                onValueChange={setInputValue}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue) {
                    handleAddTag(inputValue);
                  }
                  if (e.key === "Escape") {
                    setOpen(false);
                  }
                }}
              />
              <div className="flex items-center gap-1 ml-2">
                <Button 
                  type="button"
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                  onClick={() => {
                    setOpen(false);
                    setInputValue("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  type="button"
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10" 
                  onClick={() => handleAddTag(inputValue)}
                  disabled={!inputValue.trim()}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CommandList>
              <CommandEmpty>
                <div className="py-4 text-center text-sm">
                  {inputValue.trim() ? (
                    <p>Press Enter to add "{inputValue}"</p>
                  ) : (
                    <p className="text-muted-foreground">Type to find or add tags</p>
                  )}
                </div>
              </CommandEmpty>
              {filteredSuggestions.length > 0 && (
                <CommandGroup heading="Suggestions">
                  {filteredSuggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      value={suggestion}
                      onSelect={() => handleAddTag(suggestion)}
                      className="cursor-pointer"
                    >
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
