import { Sidebar } from "@/presentation/components/layout/Sidebar";
import { Header } from "@/presentation/components/layout/Header";
import { Footer } from "@/presentation/components/layout/Footer";
import { Box } from "@mui/material";
import { AuthGuard } from "@/presentation/components/features/auth/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh", // Force total viewport height
          width: "100vw",
          bgcolor: "background.default",
          overflow: "hidden", // Disable global scroll
        }}
      >
        <Header />
      
      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          height: "calc(100vh - 52px)", // Remaining height after Header
          overflow: "hidden",
        }}
      >
        <Sidebar />
        
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto", // Only this area scrolls
            bgcolor: "background.default",
          }}
        >
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 3 },
            }}
          >
            {children}
          </Box>
          <Footer />
        </Box>
      </Box>
    </Box>
    </AuthGuard>
  );
}
