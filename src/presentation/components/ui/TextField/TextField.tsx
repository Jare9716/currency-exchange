import { useId } from "react";
import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
} from "@mui/material";

export type TextFieldProps = MuiTextFieldProps & {
  // Custom props
};

export function TextField({
  id,
  variant = "outlined",
  size = "small",
  fullWidth = true,
  slotProps,
  sx,
  ...props
}: TextFieldProps) {
  const defaultId = useId();
  const inputId = id ?? defaultId;

  const mergedSlotProps: MuiTextFieldProps["slotProps"] = {
    ...slotProps,
    inputLabel: {
      shrink: props.label ? true : undefined,
      ...(slotProps?.inputLabel as object | undefined),
    },
  };

  return (
    <MuiTextField
      id={inputId}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      slotProps={mergedSlotProps}
      sx={sx}
      {...props}
    />
  );
}
