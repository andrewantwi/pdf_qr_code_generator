"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

export function useRequireAuth() {
  const { user, loading, refreshUser, logout } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (!loading && !user && !redirected.current) {
      redirected.current = true;
      router.replace("/login");
    }
  }, [loading, user, router]);

  return { user, loading, refreshUser, logout };
}
