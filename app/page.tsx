"use client";

import { AnimatedBackground } from "@/components/shared/animated-background";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { PasswordGate } from "@/components/shared/password-gate";

export default function LoginPage() {
  return (
    <>
      <AnimatedBackground />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <PasswordGate />
      </main>
      <Footer />
    </>
  );
}
