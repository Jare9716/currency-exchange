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
          width: "100%", // Excludes scrollbar width to prevent page-level scrollbars
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
              height: "100%", // Strictly cascade parent's height constraint
              minHeight: 0, // Allow container to shrink
              overflow: "hidden", // Disable page-level scroll completely
              bgcolor: "background.default",
            }}
          >
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                pt: { xs: 2, sm: 3 },
                pb: { xs: 1, sm: 1 },
                px: { xs: 2, sm: 3 },
                height: "100%", // Propagate explicit height to children
                minHeight: 0, // Allow content area to shrink
                overflowY: "auto", // Allow page-level scrolling for form pages when screen is small
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
