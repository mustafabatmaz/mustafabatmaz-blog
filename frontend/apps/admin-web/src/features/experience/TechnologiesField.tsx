import { Autocomplete } from "@base-ui/react/autocomplete";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { useAnnounce } from "@/components/announcer/useAnnounce";
import type { FieldProps } from "@/components/form/FormField";
import { tr } from "@/i18n/tr";
import { addTechnology, removeTechnology } from "./technologies";

interface TechnologiesFieldProps {
  field: FieldProps;
  value: string[];
  onChange: (value: string[]) => void;
  known: readonly string[];
}

// Chips are ours; Base UI Autocomplete provides the suggestion popup and its keyboard handling.
// Autocomplete (unlike Combobox) accepts free text, so technologies the backend doesn't know yet can be typed.
export function TechnologiesField({ field, value, onChange, known }: TechnologiesFieldProps) {
  const [input, setInput] = useState("");
  const [highlighted, setHighlighted] = useState<string>();
  const announce = useAnnounce();

  const suggestions = known.filter(
    (name) => !value.some((t) => t.toLowerCase() === name.toLowerCase()),
  );

  const add = (name: string) => {
    const next = addTechnology(value, name, known);
    if (next !== value) {
      onChange([...next]);
      announce(tr.experience.technologyAdded(next.at(-1) ?? name));
    }
    setInput("");
  };

  const remove = (name: string) => {
    onChange(removeTechnology(value, name));
    announce(tr.experience.technologyRemoved(name));
  };

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      {value.map((name) => (
        <span
          key={name}
          className="inline-flex h-7.5 items-center gap-0.5 rounded-full bg-mint pr-1 pl-3 font-mono text-xs text-mint-foreground"
        >
          {name}
          <button
            type="button"
            aria-label={tr.experience.removeTechnology(name)}
            className="flex size-5.5 items-center justify-center rounded-full hover:bg-mint-foreground/10"
            onClick={() => {
              remove(name);
            }}
          >
            <XIcon aria-hidden="true" className="size-3" />
          </button>
        </span>
      ))}
      <Autocomplete.Root
        items={suggestions}
        value={input}
        onValueChange={(next, details) => {
          // "item-press": a suggestion was clicked, or Enter was pressed on a highlighted one
          if (details.reason === "item-press") {
            add(next);
          } else {
            setInput(next);
          }
        }}
        onItemHighlighted={(item: string | undefined) => {
          setHighlighted(item);
        }}
      >
        <Autocomplete.Input
          {...field}
          placeholder={tr.experience.technologyPlaceholder}
          className="h-7.5 min-w-30 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          onKeyDown={(event) => {
            // Enter with no highlighted suggestion adds the typed text as a new technology
            if (event.key === "Enter" && !highlighted) {
              event.preventDefault();
              add(input);
            }
            if (event.key === "Backspace" && input === "" && value.length > 0) {
              remove(value[value.length - 1] ?? "");
            }
          }}
        />
        <Autocomplete.Portal>
          <Autocomplete.Positioner sideOffset={6} className="z-50">
            <Autocomplete.Popup className="max-h-64 w-(--anchor-width) min-w-60 overflow-y-auto rounded-xl border bg-popover p-1.5 text-popover-foreground">
              <Autocomplete.Empty>
                {input.trim() && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    {tr.experience.addTechnologyHint(input.trim())}
                  </p>
                )}
              </Autocomplete.Empty>
              <Autocomplete.List>
                {(item: string) => (
                  <Autocomplete.Item
                    key={item}
                    value={item}
                    className="cursor-default rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                  >
                    {item}
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
    </div>
  );
}
