import { Box, LinearProgress, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

type PasswordStrengthProps = {
  password: string;
};

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const rules = [
    { label: "8+ caracteres", ok: password.length >= 8 },
    { label: "Mayúscula", ok: /[A-Z]/.test(password) },
    { label: "Minúscula", ok: /[a-z]/.test(password) },
    { label: "Número", ok: /\d/.test(password) },
  ];
  const score = rules.filter((rule) => rule.ok).length;

  return (
    <Box sx={{ mt: 1 }}>
      <LinearProgress
        variant="determinate"
        value={(score / rules.length) * 100}
        color={score >= 4 ? "success" : score >= 2 ? "warning" : "error"}
        sx={{ height: 4, borderRadius: 1, mb: 1 }}
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 0.5,
        }}
      >
        {rules.map((rule) => (
          <Box key={rule.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CheckCircleOutlineIcon
              color={rule.ok ? "success" : "disabled"}
              sx={{ fontSize: 14 }}
            />
            <Typography
              variant="caption"
              sx={{ color: rule.ok ? "success.main" : "text.secondary" }}
            >
              {rule.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

type TotpInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function TotpInput({ value, onChange }: TotpInputProps) {
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? "");

  const handleChange = (index: number, nextValue: string) => {
    const digit = nextValue.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    onChange(nextDigits.join(""));
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", gap: 1, my: 2 }}>
      {digits.map((digit, index) => (
        <Box
          key={index}
          component="input"
          aria-label={`Dígito ${index + 1}`}
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          sx={{
            width: { xs: 40, sm: 50 },
            height: { xs: 48, sm: 56 },
            border: "2px solid",
            borderColor: digit ? "primary.main" : "divider",
            borderRadius: 1,
            textAlign: "center",
            fontSize: 24,
            fontWeight: 600,
            fontFamily: "monospace",
            color: "text.primary",
            bgcolor: "background.paper",
            outline: "none",
            "&:focus": {
              borderColor: "primary.main",
            },
          }}
        />
      ))}
    </Box>
  );
}
