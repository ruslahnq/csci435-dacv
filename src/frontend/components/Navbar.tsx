"use client";

import { Shield, Wallet, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet, truncateAddress } from "@/lib/WalletContext";
import { cn } from "@/lib/utils";

type TabValue = "issuer" | "holder" | "verifier";

interface NavbarProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

const tabs: { value: TabValue; label: string }[] = [
  { value: "issuer", label: "Issuer" },
  { value: "holder", label: "Holder" },
  { value: "verifier", label: "Verifier" },
];

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const {
    address,
    isConnected,
    isCorrectNetwork,
    networkName,
    connect,
    isConnecting,
  } = useWallet();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            SBT-Verify
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden items-center gap-1 rounded-lg bg-muted p-1 md:flex">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Mobile Navigation */}
        <nav className="flex items-center gap-1 rounded-lg bg-muted p-1 md:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Wallet Status */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isCorrectNetwork ? "bg-success" : "bg-warning"
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  {networkName}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">
                  {truncateAddress(address!)}
                </span>
              </div>
            </div>
          ) : (
            <Button
              onClick={connect}
              disabled={isConnecting}
              className="gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Wrong Network Warning */}
      {isConnected && !isCorrectNetwork && (
        <div className="flex items-center justify-center gap-2 bg-warning px-4 py-2 text-warning-foreground">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Please switch to Sepolia network to use this application
          </span>
        </div>
      )}
    </header>
  );
}
