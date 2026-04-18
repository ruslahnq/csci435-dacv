"use client";

import { ExternalLink, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ETHERSCAN_BASE_URL, DEGREE_OPTIONS } from "@/lib/config";
import type { Credential } from "@/lib/api";

interface CredentialCardProps {
  credential: Credential;
}

function formatDegree(degreeValue: string): string {
  const degree = DEGREE_OPTIONS.find((d) => d.value === degreeValue);
  return degree?.label || degreeValue;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CredentialCard({ credential }: CredentialCardProps) {
  const {
    token_id,
    metadata,
    is_active,
    issued_at,
    transaction_hash,
  } = credential;

  const institution = metadata.institution || "University";
  const etherscanUrl = transaction_hash
    ? `${ETHERSCAN_BASE_URL}/tx/${transaction_hash}`
    : null;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      {/* Decorative gradient */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
      
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <StatusBadge isActive={is_active} />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span className="text-xs">Token #{token_id}</span>
          </div>
        </div>

        {/* Institution */}
        <p className="mb-1 text-sm text-muted-foreground">{institution}</p>

        {/* Degree & Major */}
        <h3 className="mb-1 text-lg font-semibold text-foreground">
          {formatDegree(metadata.degree)}
        </h3>
        <p className="text-base text-primary">{metadata.major}</p>

        {/* Year */}
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span>Class of {metadata.graduation_year}</span>
          {metadata.gpa && <span>GPA: {metadata.gpa}</span>}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">
            Issued {formatDate(issued_at)}
          </span>
          {etherscanUrl && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={etherscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on Etherscan
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
