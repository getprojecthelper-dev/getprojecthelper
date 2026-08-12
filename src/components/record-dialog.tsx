import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "date" | "number";
  options?: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

export type RecordValues = Record<string, string>;

export function RecordDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  submitLabel = "Save",
  onSubmit,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldConfig[];
  initial?: RecordValues;
  submitLabel?: string;
  busy?: boolean;
  onSubmit: (values: RecordValues) => void;
}) {
  const [values, setValues] = useState<RecordValues>({});

  useEffect(() => {
    if (open) {
      const base: RecordValues = {};
      for (const f of fields) base[f.name] = initial?.[f.name] ?? (f.options?.[0]?.value ?? "");
      setValues(base);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const missing = fields.some((f) => f.required && !values[f.name]?.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.name} className="space-y-2">
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  rows={f.rows ?? 3}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                />
              ) : f.type === "select" ? (
                <Select
                  value={values[f.name] ?? ""}
                  onValueChange={(val) => setValues((v) => ({ ...v, [f.name]: val }))}
                >
                  <SelectTrigger id={f.name}>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={f.name}
                  type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={missing || busy} onClick={() => onSubmit(values)}>
            {busy ? "Saving…" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ListRow({
  title,
  meta,
  badges,
  actions,
  children,
}: {
  title: ReactNode;
  meta?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{title}</span>
          {badges}
        </div>
        {meta ? <div className="mt-1 text-xs text-muted-foreground">{meta}</div> : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </div>
  );
}
