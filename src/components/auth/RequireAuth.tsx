"use client";

import { getAccessToken } from "@/lib/auth-storage";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">Checking session…</p>
    );
  }

  return <>{children}</>;
}
