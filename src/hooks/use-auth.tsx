import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  ready: boolean;
  session: Session | null;
  user: User | null;
  /** UI hint only. Every admin action is enforced by database policies. */
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  ready: false,
  session: null,
  user: null,
  isAdmin: false,
  signOut: async () => {},
});

async function checkAdmin(userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return !error && data === true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<Omit<AuthState, "signOut">>({ ready: false, session: null, user: null, isAdmin: false });

  useEffect(() => {
    let active = true;
    const apply = async (session: Session | null) => {
      const isAdmin = session ? await checkAdmin(session.user.id) : false;
      if (active) setState({ ready: true, session, user: session?.user ?? null, isAdmin });
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      // Defer: calling the backend inside this callback can deadlock the auth lock,
      // which leaves "Sign in" spinning forever.
      setTimeout(() => {
        void apply(session);
        router.invalidate();
      }, 0);
      if (event === "SIGNED_OUT") queryClient.removeQueries({ queryKey: ["admin"] });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signOut: async () => {
          await queryClient.cancelQueries();
          queryClient.clear();
          await supabase.auth.signOut();
          await router.navigate({ to: "/login", replace: true });
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
