import { Button as MuiButton, ButtonProps as MuiButtonProps, CircularProgress } from "@mui/material";

export type ButtonProps = MuiButtonProps & {
  // Add custom props here if needed in the future
  customProp?: boolean;
  loading?: boolean;
};

export function Button({ children, variant = "contained", fullWidth = true, loading, disabled, ...props }: ButtonProps) {
  return (
    <MuiButton
      variant={variant}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        ...props.sx,
      }}
      {...props}
    >
      {loading ? <CircularProgress size={20} color="inherit" /> : children}
    </MuiButton>
  );
}
