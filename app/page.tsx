"use client";

import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { PasswordGate } from "@/components/shared/password-gate";

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <PasswordGate />
      </main>
      <Footer />
    </>
  );
}
