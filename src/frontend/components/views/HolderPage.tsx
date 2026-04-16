"use client";

import { useEffect, useState } from "react";
import { Wallet, GraduationCap, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CredentialCard } from "@/components/CredentialCard";
import { CredentialCardSkeleton } from "@/components/LoadingSkeleton";
import { useWallet } from "@/lib/WalletContext";
import { getStudentCredentials, type Credential } from "@/lib/api";

type LoadingState = "idle" | "loading" | "success" | "error";

export function HolderPage() {
  const { address, isConnected, isCorrectNetwork, connect, isConnecting } =
    useWallet();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchCredentials = async () => {
    if (!address) return;

    setLoadingState("loading");
    setError(null);

    try {
      const data = await getStudentCredentials(address);
      setCredentials(data);
      setLoadingState("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch credentials";
      setError(message);
      setLoadingState("error");
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork && address) {
      fetchCredentials();
    }
  }, [isConnected, isCorrectNetwork, address]);

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Connect Your Wallet</h2>
          <p className="mb-6 max-w-sm text-muted-foreground">
            Connect your wallet to view your academic credentials stored on the
            blockchain.
          </p>
          <Button onClick={connect} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Wrong network state
  if (!isCorrectNetwork) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <AlertCircle className="h-8 w-8 text-warning" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Wrong Network</h2>
          <p className="max-w-sm text-muted-foreground">
            Please switch to Sepolia network to view your credentials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">My Academic Credentials</h1>
            <p className="mt-1 text-muted-foreground">
              View all credentials issued to your wallet address
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchCredentials}
            disabled={loadingState === "loading"}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                loadingState === "loading" ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>

        {/* Loading State */}
        {loadingState === "loading" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <CredentialCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {loadingState === "error" && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/50 bg-destructive/10 p-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">
              Failed to Load Credentials
            </h3>
            <p className="mb-4 max-w-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchCredentials}>Try Again</Button>
          </div>
        )}

        {/* Empty State */}
        {loadingState === "success" && credentials.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No Credentials Found</h3>
            <p className="max-w-sm text-muted-foreground">
              You don&apos;t have any academic credentials yet. Credentials
              issued to your wallet address will appear here.
            </p>
          </div>
        )}

        {/* Credentials Grid */}
        {loadingState === "success" && credentials.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {credentials.map((credential) => (
              <CredentialCard key={credential.token_id} credential={credential} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
