import * as React from "react";
import TextField from "@mui/material/TextField";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
  label?: string;
  helperText?: React.ReactNode;
};

export function Input({
  className,
  label,
  helperText,
  ...props
}: InputProps) {
  return (
    <TextField
      size="small"
      variant="outlined"
      fullWidth
      label={label}
      helperText={helperText}
      className={cn(className)}
      value={props.value ?? ""}
      onChange={props.onChange}
      name={props.name}
      type={props.type}
      placeholder={props.placeholder}
      disabled={props.disabled}
      required={props.required}
      autoFocus={props.autoFocus}
      multiline={false}
      inputProps={{
        min: props.min,
        max: props.max,
        step: props.step,
        pattern: props.pattern,
        inputMode: props.inputMode,
        maxLength: props.maxLength,
      }}
    />
  );
}
