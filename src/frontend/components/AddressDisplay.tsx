"use client";

import { Button } from "@/components/ui/button";
import { ETHERSCAN_BASE_URL } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface AddressDisplayProps {
  address?: string | null;
  type?: "address" | "tx";
  truncate?: boolean;
  showCopy?: boolean;
  showEtherscan?: boolean;
  className?: string;
}

export function AddressDisplay({
  address,
  type = "address",
  truncate = true,
  showCopy = true,
  showEtherscan = true,
  className,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!address) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <code className="rounded bg-muted px-2 py-1 font-mono text-sm text-muted-foreground">
          N/A
        </code>
      </div>
    );
  }

  const displayAddress = truncate
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address;

  const etherscanPath = type === "tx" ? "tx" : "address";
  const etherscanUrl = `${ETHERSCAN_BASE_URL}/${etherscanPath}/${address}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
        {displayAddress}
      </code>
      {showCopy && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
      {showEtherscan && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          asChild
        >
          <a
            href={etherscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="View on Etherscan"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      )}
    </div>
  );
}
