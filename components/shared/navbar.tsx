"use client";

import { motion } from "framer-motion";
import { ScanSearch, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth } from "@/lib/auth";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/";

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-black/80 backdrop-blur-xl shadow-sm"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ScanSearch className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">ResumeLens</span>
        </Link>
        <div className="flex items-center gap-3">
          {!isLoginPage && (
            <>
              <Link
                href="/dashboard"
                className={`text-sm transition-colors hover:text-primary ${
                  pathname === "/dashboard" ? "text-primary font-medium" : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/candidates"
                className={`text-sm transition-colors hover:text-primary ${
                  pathname.startsWith("/candidates") ? "text-primary font-medium" : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Candidates
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 transition-all hover:border-red-300 hover:bg-red-500/10 hover:text-red-500"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </>
          )}
          <a
            href="https://revinobakmaldi.vercel.app"
            className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Portfolio
          </a>
        </div>
      </div>
    </motion.nav>
  );
}
