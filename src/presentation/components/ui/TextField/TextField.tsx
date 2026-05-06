import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from "@mui/material";

export type TextFieldProps = MuiTextFieldProps & {
  // Custom props
};

export function TextField({ variant = "outlined", fullWidth = true, ...props }: TextFieldProps) {
  return (
    <MuiTextField
      variant={variant}
      fullWidth={fullWidth}
      slotProps={{
        inputLabel: {
          shrink: true,
        },
      }}
      sx={{
        "& .MuiInputBase-root": {
          fontSize: "16px",
        },
        ...props.sx,
      }}
      {...props}
    />
  );
}
