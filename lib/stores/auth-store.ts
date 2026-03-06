import { create } from "zustand"
import type { Organization, Profile } from "@/lib/crm-types"

interface AuthState {
  user: { id: string; email: string } | null
  profile: Profile | null
  organization: Organization | null
  isLoading: boolean
  setUser: (user: AuthState["user"]) => void
  setProfile: (profile: Profile | null) => void
  setOrganization: (org: Organization | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  organization: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setOrganization: (organization) => set({ organization }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      user: null,
      profile: null,
      organization: null,
      isLoading: false,
    }),
}))
