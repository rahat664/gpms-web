import Chip from "@mui/material/Chip";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <Chip size="small" label={children} className={cn(className)} />;
}
