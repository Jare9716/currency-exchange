import { useAuthStore } from "@/presentation/stores/auth.store";

export interface OperatorDetails {
  name: string;
  branch: string;
  role: string;
  company: string;
}

export function getOperatorDetails(): OperatorDetails {
  if (typeof window === "undefined") {
    return {
      name: "Carlos Sierra Melo",
      branch: "BOG01",
      role: "operator",
      company: "Cambios Express SAS",
    };
  }

  const token = useAuthStore.getState().accessToken;
  if (!token) {
    return {
      name: "Carlos Sierra Melo",
      branch: "BOG01",
      role: "operator",
      company: "Cambios Express SAS",
    };
  }

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return {
      name: payload.full_name || payload.name || "Carlos Sierra Melo",
      branch: payload.branch_code || payload.branch || "BOG01",
      role: payload.role || "operator",
      company: payload.company_name || payload.company || "Cambios Express SAS",
    };
  } catch {
    return {
      name: "Carlos Sierra Melo",
      branch: "BOG01",
      role: "operator",
      company: "Cambios Express SAS",
    };
  }
}
