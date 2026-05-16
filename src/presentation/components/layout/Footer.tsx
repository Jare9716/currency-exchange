import { Box, Typography, Container } from "@mui/material";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        mt: "auto",
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Container maxWidth={false}>
        <Typography variant="body2" color="text.secondary" align="center">
          {"JokerLabs © "}
          {currentYear}
          {". Todos los derechos reservados."}
        </Typography>
      </Container>
    </Box>
  );
}
