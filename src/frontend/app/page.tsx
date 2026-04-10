"use client";
// SBT-Verify Main Application

import { useState } from "react";
import { WalletProvider } from "@/lib/WalletContext";
import { Navbar } from "@/components/Navbar";
import { IssuerPage } from "@/components/views/IssuerPage";
import { HolderPage } from "@/components/views/HolderPage";
import { VerifierPage } from "@/components/views/VerifierPage";

type TabValue = "issuer" | "holder" | "verifier";

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabValue>("issuer");

  return (
    <WalletProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex flex-1 flex-col">
          {activeTab === "issuer" && <IssuerPage />}
          {activeTab === "holder" && <HolderPage />}
          {activeTab === "verifier" && <VerifierPage />}
        </main>
      </div>
    </WalletProvider>
  );
}
