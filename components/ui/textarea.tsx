import * as React from "react";
import TextField from "@mui/material/TextField";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  multiline = true,
  minRows = 4,
  size = "small",
  variant = "outlined",
  fullWidth = true,
  ...props
}: React.ComponentProps<typeof TextField>) {
  return (
    <TextField
      multiline={multiline}
      minRows={minRows}
      size={size}
      variant={variant}
      fullWidth={fullWidth}
      className={cn(className)}
      {...props}
    />
  );
}
