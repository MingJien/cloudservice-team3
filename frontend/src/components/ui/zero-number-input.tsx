import type { FocusEventHandler } from "react";
import { Input } from "@/components/ui/input";
import type { InputProps } from "@/components/ui/input";

export interface ZeroNumberInputProps extends Omit<InputProps, "onBlur" | "onChange" | "onFocus" | "value"> {
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
}

export function ZeroNumberInput({
  type = "number",
  value,
  onValueChange,
  onBlur,
  onFocus,
  ...props
}: ZeroNumberInputProps) {
  return (
    <Input
      {...props}
      type={type}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      onFocus={(event) => {
        if (event.currentTarget.value === "0") onValueChange("");
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (event.currentTarget.value.trim() === "") onValueChange("0");
        onBlur?.(event);
      }}
    />
  );
}
