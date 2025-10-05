"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const completeSignIn = async () => {
      try {
        const href = window.location.href;
        const hasQueryCode = href.includes("code=");
        // We only support PKCE flow. If tokens are returned in the hash
        // (implicit flow), bail out and send the user back to /login.
        const hasHashToken =
          href.includes("#access_token=") || href.includes("#id_token=");

        if (hasQueryCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(href);
          if (error) {
            console.error("exchangeCodeForSession error", error);
            router.replace("/login");
            return;
          }
          router.replace("/chat");
          return;
        }

        if (hasHashToken) {
          // Fallback: handle implicit flow by extracting tokens from the hash
          const hash = href.split("#")[1] || "";
          const params = new URLSearchParams(hash);
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (!error) {
              router.replace("/chat");
              return;
            }
          }

          // If we couldn't set a session, restart sign-in
          router.replace("/login");
          return;
        }

        // No code in URL – check if we already have a session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        router.replace(session ? "/chat" : "/login");
      } catch (e) {
        console.error(e);
        router.replace("/login");
      }
    };

    if (typeof window !== "undefined") completeSignIn();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f9fafc] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6c63ff]"></div>
    </div>
  );
}
