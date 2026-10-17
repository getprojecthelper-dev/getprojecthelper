import { cn } from "@/lib/utils";

/** Google Material Symbols, used for the product's shared icon language. */
export function MaterialIcon({
  name,
  className,
  filled = false,
  label,
}: {
  name: string;
  className?: string;
  filled?: boolean;
  label?: string;
}) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn("material-symbols-rounded", filled && "material-symbols-filled", className)}
    >
      {name}
    </span>
  );
}
