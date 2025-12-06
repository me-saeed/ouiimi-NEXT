"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BusinessPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/business/dashboard");
  }, [router]);

  return null;
}
