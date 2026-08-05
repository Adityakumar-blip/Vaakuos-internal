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
import { useGetTagsQuery, useCreateTagMutation } from "@/store/api/tagsApi";
import { useDebounce } from "@/hooks/use-debounce";

export interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
}

export function TagInput({
  tags = [],
  onChange,
  placeholder = "Add tag...",
  className,
  radius = "md",
}: TagInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const debouncedSearch = useDebounce(inputValue, 300);

  const { data: suggestionsData, isFetching: isLoading } = useGetTagsQuery(
    { search: debouncedSearch },
    { skip: !debouncedSearch.trim() }
  );

  const [createTag] = useCreateTagMutation();

  const handleAddTag = async (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      try {
        // Find if tag already exists in suggestions to avoid unnecessary creation
        const existingTag = suggestionsData?.find(
          (t) => t.name.toLowerCase() === trimmedTag.toLowerCase()
        );
        
        if (!existingTag) {
          await createTag({ name: trimmedTag }).unwrap();
        }
        
        onChange([...tags, trimmedTag]);
      } catch (error) {
        console.error("Failed to add tag:", error);
      }
    }
    setInputValue("");
    setOpen(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const suggestions = React.useMemo(() => {
    return suggestionsData?.map((t) => t.name) || [];
  }, [suggestionsData]);

  const filteredSuggestions = suggestions.filter(
    (suggestion) => 
      !tags.includes(suggestion) && 
      suggestion.toLowerCase() !== inputValue.toLowerCase().trim()
  );

  console.log("Suggestions:", suggestions);

  const roundedClass = radius === "full" ? "rounded-full" : `rounded-${radius}`;

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className={cn(
            "pl-2 pr-1 py-1 gap-1 flex items-center bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors",
            roundedClass
          )}
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
            className={cn(
              "h-8 w-8 p-0 border-dashed border-primary/50 text-primary hover:text-primary hover:border-primary hover:bg-primary/5",
              roundedClass
            )}
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0" align="start">
          <Command shouldFilter={false} className="rounded-lg border shadow-md">
            <div className="flex items-center border-b px-3">
              <CommandInput
                placeholder={placeholder}
                value={inputValue}
                onValueChange={setInputValue}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                onKeyDown={(e) => {
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
              {isLoading && (
                <div className="py-2 px-3 text-xs text-muted-foreground italic border-b">
                  Searching suggestions...
                </div>
              )}
              
              {inputValue.trim() ? (
                <>
                  <CommandGroup>
                    <CommandItem
                      value={inputValue}
                      onSelect={() => handleAddTag(inputValue)}
                      className="cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4 text-primary" />
                      <span className="font-medium">Add "{inputValue}"</span>
                    </CommandItem>
                  </CommandGroup>

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
                </>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Type to search or add tags
                </div>
              )}
              <CommandEmpty />
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
