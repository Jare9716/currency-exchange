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
      name: "",
      branch: "",
      role: "",
      company: "",
    };
  }

  const state = useAuthStore.getState();
  const profile = state.userProfile;
  const branch = state.activeBranchCode;

  if (!state.accessToken) {
    throw new Error("No active session token found. Please log in.");
  }

  if (!profile) {
    return {
      name: "",
      branch: branch || "",
      role: "",
      company: "",
    };
  }

  return {
    name: profile.fullName,
    branch: branch || profile.branchCode || "",
    role: profile.role,
    company: profile.companyName,
  };
}
