"use client";

const TOKEN_KEY = "pdfqr_token";

export interface AuthUser {
  id: string;
  username: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token || token === "undefined" || token === "null") {
    return null;
  }
  
  return token;
}

export function setToken(token: string) {
  if (typeof window !== "undefined" && token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function fetchUser(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;
  
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (!res.ok) { 
      clearToken(); 
      return null; 
    }
    
    return await res.json();
  } catch (error) {
    clearToken(); 
    return null;
  }
}