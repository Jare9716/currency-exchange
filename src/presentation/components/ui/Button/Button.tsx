import { Button as MuiButton, ButtonProps as MuiButtonProps } from "@mui/material";

export type ButtonProps = MuiButtonProps & {
  // Add custom props here if needed in the future
  customProp?: boolean;
};

export function Button({ children, variant = "contained", fullWidth = true, ...props }: ButtonProps) {
  return (
    <MuiButton
      variant={variant}
      fullWidth={fullWidth}
      sx={{
        height: "42px",
        fontSize: "16px",
        textTransform: "none", // Avoid all-caps default
        fontWeight: 600,
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
}
