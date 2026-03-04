import FormLabel from "@mui/material/FormLabel";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.ComponentProps<typeof FormLabel>) {
  return <FormLabel className={cn("text-sm", className)} {...props} />;
}
