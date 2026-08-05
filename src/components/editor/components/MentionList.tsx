import React, {
    useState,
    useEffect,
    useRef,
    forwardRef,
    useImperativeHandle,
} from 'react';

interface MentionUser {
    id: string;
    name: string;
    role: string;
}

interface MentionListProps {
    items: MentionUser[];
    command: (item: { id: string; label: string; }) => void;
}

export interface MentionListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command({ id: item.id, label: item.name });
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    // Auto-scroll selected item into view (without scrolling the page)
    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const selected = container.children[selectedIndex] as HTMLElement | undefined;
        if (!selected) return;

        const containerScrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const itemTop = selected.offsetTop;
        const itemHeight = selected.offsetHeight;

        // Add a buffer to account for container padding
        const buffer = 8;

        if (itemTop < containerScrollTop + buffer) {
            // Scroll up
            container.scrollTop = itemTop - buffer;
        } else if (itemTop + itemHeight > containerScrollTop + containerHeight - buffer) {
            // Scroll down
            container.scrollTop = itemTop + itemHeight - containerHeight + buffer;
        }
    }, [selectedIndex]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }
            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }
            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }
            return false;
        },
    }));

    if (props.items.length === 0) return null;

    return (
        <div ref={containerRef} className="bg-popover border border-border shadow-md rounded-lg p-2 min-w-[200px] flex flex-col gap-1 z-50">
            {props.items.map((item: MentionUser, index: number) => (
                <button
                    type="button"
                    className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left ${index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted bg-transparent'}`}
                    key={index}
                    onClick={() => selectItem(index)}
                    onMouseEnter={() => setSelectedIndex(index)}
                >
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
                        {item.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm leading-none">{item.name}</span>
                        <span className="text-xs text-muted-foreground mt-1">{item.role}</span>
                    </div>
                </button>
            ))}
        </div>
    );
});

MentionList.displayName = 'MentionList';
