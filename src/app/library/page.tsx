"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** The Library page moved to /my-characters — keep old links working. */
export default function LibraryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/my-characters");
  }, [router]);
  return null;
}
