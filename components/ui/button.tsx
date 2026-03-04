import * as React from "react";
import MuiButton, { type ButtonProps as MuiButtonProps } from "@mui/material/Button";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "secondary" | "ghost" | "destructive";
type Size = "default" | "sm" | "lg";

export interface ButtonProps extends Omit<MuiButtonProps, "variant" | "size" | "color"> {
  variant?: Variant;
  size?: Size;
}

const variantMap: Record<Variant, MuiButtonProps["variant"]> = {
  default: "contained",
  outline: "outlined",
  secondary: "contained",
  ghost: "text",
  destructive: "contained",
};

const colorMap: Record<Variant, MuiButtonProps["color"]> = {
  default: "primary",
  outline: "primary",
  secondary: "secondary",
  ghost: "inherit",
  destructive: "error",
};

const sizeMap: Record<Size, MuiButtonProps["size"]> = {
  default: "medium",
  sm: "small",
  lg: "large",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => (
    <MuiButton
      ref={ref}
      variant={variantMap[variant]}
      color={colorMap[variant]}
      size={sizeMap[size]}
      className={cn(className)}
      {...props}
    >
      {children}
    </MuiButton>
  ),
);
Button.displayName = "Button";

export { Button };
