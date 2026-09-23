"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Category } from "@/components/ui/EventCard";
import type { OrganizerType } from "@/components/ui/OrgLogo";
import { EVENT_CATEGORIES } from "@/lib/types";
import { HttpStatusError, getJson } from "./http";
import { AUTH_AVAILABLE, getBrowserSupabase } from "./supabase-browser";

/** An organizer the signed-in account manages (a row in organizer_members). */
export type ManagedOrganizer = {
  id: string;
  slug: string;
  name: string;
  type: OrganizerType;
  category: Category;
  logo?: string;
};

export type AuthUser = { id: string; email: string | null };

export type SignInResult = "ok" | "invalid" | "unavailable" | "error";

type AuthValue = {
  /** false until the stored session and, when signed in, the memberships have been read; gate organizer-only UI on it */
  ready: boolean;
  /** whether sign-in exists on this build (the public Supabase env is set) */
  available: boolean;
  user: AuthUser | null;
  organizers: ManagedOrganizer[];
  isMemberOf: (slug: string) => boolean;
  /** a row in `admins`: the account manages every organizer and event, and the access requests */
  isAdmin: boolean;
  /** a member of that organizer, or an admin — what the edit screens gate on */
  canManage: (slug: string) => boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

type MeResponse = {
  user: AuthUser;
  organizers: { id: string; slug: string; name: string; type: string | null; category: string | null; logo_file: string | null }[];
  is_admin?: boolean;
};

const ORGANIZER_TYPES: OrganizerType[] = ["association", "cafe", "club", "venue"];

function toManaged(row: MeResponse["organizers"][number]): ManagedOrganizer {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: ORGANIZER_TYPES.includes(row.type as OrganizerType) ? (row.type as OrganizerType) : "association",
    category: (EVENT_CATEGORIES as readonly string[]).includes(row.category ?? "") ? (row.category as Category) : "Social",
    logo: row.logo_file ?? undefined,
  };
}

const AuthContext = createContext<AuthValue | null>(null);

/** Wraps the app in app/layout.tsx. Organizer accounts only; students stay without one. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionRead, setSessionRead] = useState(!AUTH_AVAILABLE);
  // Memberships are keyed by user so a sign-out never shows the previous account's organizers.
  const [memberships, setMemberships] = useState<{ userId: string; organizers: ManagedOrganizer[]; isAdmin: boolean } | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setSessionRead(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    getJson<MeResponse>("/api/me")
      .then((me) => {
        if (active) setMemberships({ userId, organizers: me.organizers.map(toManaged), isAdmin: me.is_admin === true });
      })
      .catch((error: unknown) => {
        if (!active) return;
        // A 401 means the stored session was revoked elsewhere (a sign-out on another device, an
        // expired refresh token): drop it locally so the UI shows signed out instead of a half state.
        if (error instanceof HttpStatusError && error.status === 401) {
          void getBrowserSupabase()?.auth.signOut({ scope: "local" });
          return;
        }
        setMemberships({ userId, organizers: [], isAdmin: false });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    const supabase = getBrowserSupabase();
    if (!supabase) return "unavailable";
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (!error) return "ok";
    return error.status === 400 ? "invalid" : "error";
  }, []);

  const signOut = useCallback(async () => {
    // Local scope: only this browser signs out, other devices of the same account keep their session.
    await getBrowserSupabase()?.auth.signOut({ scope: "local" });
  }, []);

  const value = useMemo<AuthValue>(() => {
    const user: AuthUser | null = session ? { id: session.user.id, email: session.user.email ?? null } : null;
    const membershipsLoaded = !user || memberships?.userId === user.id;
    const organizers = user && membershipsLoaded ? (memberships?.organizers ?? []) : [];
    const isAdmin = Boolean(user && membershipsLoaded && memberships?.isAdmin);
    const isMemberOf = (slug: string) => organizers.some((organizer) => organizer.slug === slug);
    return {
      ready: sessionRead && membershipsLoaded,
      available: AUTH_AVAILABLE,
      user,
      organizers,
      isMemberOf,
      isAdmin,
      canManage: (slug) => isAdmin || isMemberOf(slug),
      signIn,
      signOut,
    };
  }, [session, memberships, sessionRead, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}
