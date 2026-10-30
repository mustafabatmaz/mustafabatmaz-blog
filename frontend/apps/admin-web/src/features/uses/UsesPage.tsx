import { ArrowDownIcon, ArrowUpIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";
import { useAnnounce } from "@/components/announcer/useAnnounce";
import { ConfirmDialog } from "@/components/form/ConfirmDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadError, Loading } from "@/components/layout/QueryState";
import { Button } from "@/components/ui/button";
import { tr } from "@/i18n/tr";
import { UsesItemEditor } from "./UsesItemEditor";
import { groupByCategory, moveWithinCategory } from "./usesOrder";
import { categoryLabels, displayName, type UsesItem } from "./usesSchema";
import { useDeleteUsesItem, useReorderUses, useUsesItems } from "./useUses";

export function UsesPage() {
  const uses = useUsesItems();
  const reorder = useReorderUses();
  const remove = useDeleteUsesItem();
  const announce = useAnnounce();
  // undefined: no dialog; null: a new item; otherwise the item being edited
  const [editing, setEditing] = useState<UsesItem | null>();
  const [deleting, setDeleting] = useState<UsesItem>();
  const [highlighted, setHighlighted] = useState<number>();

  const items = uses.data ?? [];

  const highlight = (id: number | undefined) => {
    setHighlighted(id);
    window.setTimeout(() => {
      setHighlighted((current) => (current === id ? undefined : current));
    }, 2000);
  };

  const move = (item: UsesItem, direction: "up" | "down") => {
    const ids = moveWithinCategory(items, item.id, direction);
    if (!ids) {
      return;
    }
    reorder.mutate(ids, {
      onSuccess: (saved) => {
        const group = groupByCategory(saved).find((g) => g.category === item.category);
        const position = (group?.items.findIndex((i) => i.id === item.id) ?? 0) + 1;
        announce(tr.uses.moved(displayName(item), position));
      },
      onError: () => {
        announce(tr.uses.reorderFailed);
      },
    });
  };

  return (
    <>
      <PageHeader
        kicker={uses.isSuccess ? tr.uses.count(items.length) : tr.nav.profileGroup}
        title={tr.uses.title}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
            }}
          >
            <PlusIcon aria-hidden="true" />
            {tr.uses.newItem}
          </Button>
        }
      />

      {uses.isPending && <Loading />}
      {uses.isError && <LoadError onRetry={() => void uses.refetch()} />}
      {reorder.isError && (
        <p role="alert" className="rounded-2xl bg-destructive-soft px-4.5 py-3.5 text-destructive">
          {tr.uses.reorderFailed}
        </p>
      )}
      {remove.isError && (
        <p role="alert" className="rounded-2xl bg-destructive-soft px-4.5 py-3.5 text-destructive">
          {tr.uses.deleteFailed}
        </p>
      )}
      {uses.isSuccess && items.length === 0 && (
        <p className="text-muted-foreground">{tr.uses.empty}</p>
      )}

      {groupByCategory(items).map((group) => (
        <section
          key={group.category}
          aria-labelledby={`uses-${group.category}`}
          className="flex flex-col gap-2.5"
        >
          <h2
            id={`uses-${group.category}`}
            className="font-mono text-[13px] font-normal text-muted-foreground"
          >
            {categoryLabels[group.category]}
          </h2>
          <ul className="overflow-hidden rounded-2xl border bg-card">
            {group.items.map((item, index) => {
              const name = displayName(item);
              const description = item.translations.find((t) => t.description)?.description;
              const languages = item.translations.map((t) => t.lang.toUpperCase()).join(" ");
              return (
                // key={item.id}: a moved row keeps its DOM element, and with it the focus (Angular trackBy)
                <li
                  key={item.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 border-t py-3.5 pr-4 pl-5 transition-colors duration-700 first:border-t-0",
                    highlighted === item.id && "bg-accent",
                  )}
                >
                  <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
                    <span className="font-semibold">
                      {name}{" "}
                      <span className="font-mono text-[11px] font-normal text-muted-foreground">
                        {languages}
                      </span>
                    </span>
                    {description && (
                      <span className="text-sm text-muted-foreground">{description}</span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={tr.uses.moveUp(name)}
                      disabled={index === 0 || reorder.isPending}
                      onClick={() => {
                        move(item, "up");
                      }}
                    >
                      <ArrowUpIcon aria-hidden="true" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={tr.uses.moveDown(name)}
                      disabled={index === group.items.length - 1 || reorder.isPending}
                      onClick={() => {
                        move(item, "down");
                      }}
                    >
                      <ArrowDownIcon aria-hidden="true" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={tr.uses.edit(name)}
                      onClick={() => {
                        setEditing(item);
                      }}
                    >
                      {tr.uses.editLabel}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      aria-label={tr.uses.remove(name)}
                      onClick={() => {
                        setDeleting(item);
                      }}
                    >
                      {tr.uses.removeLabel}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {editing !== undefined && (
        <UsesItemEditor
          key={editing?.id ?? "new"}
          item={editing}
          onClose={() => {
            setEditing(undefined);
          }}
          onSaved={(saved) => {
            announce(tr.uses.saved(displayName(saved)));
            highlight(saved.id);
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== undefined}
        title={tr.uses.deleteTitle}
        description={deleting ? tr.uses.deleteDescription(displayName(deleting)) : ""}
        cancelLabel={tr.uses.cancel}
        confirmLabel={tr.uses.removeLabel}
        destructive
        onCancel={() => {
          setDeleting(undefined);
        }}
        onConfirm={() => {
          if (deleting?.id === undefined) {
            return;
          }
          const name = displayName(deleting);
          remove.mutate(deleting.id, {
            onSuccess: () => {
              announce(tr.uses.removed(name));
            },
          });
          setDeleting(undefined);
        }}
      />
    </>
  );
}
