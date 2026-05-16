import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
} from "@mui/material";

export type TextFieldProps = MuiTextFieldProps & {
  // Custom props
};

export function TextField({
  variant = "outlined",
  size = "small",
  fullWidth = true,
  slotProps,
  sx,
  ...props
}: TextFieldProps) {
  const mergedSlotProps: MuiTextFieldProps["slotProps"] = {
    ...slotProps,
    inputLabel: {
      shrink: props.label ? true : undefined,
      ...(slotProps?.inputLabel as object | undefined),
    },
  };

  return (
    <MuiTextField
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      slotProps={mergedSlotProps}
      sx={sx}
      {...props}
    />
  );
}
