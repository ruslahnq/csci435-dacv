"use client";

import { useState } from "react";
import {
  Search,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet, checksumAddress } from "@/lib/WalletContext";
import { verifyCredential, type VerifyCredentialResponse } from "@/lib/api";
import { DEGREE_OPTIONS } from "@/lib/config";

type VerificationState =
  | "idle"
  | "loading"
  | "valid"
  | "revoked"
  | "mismatch"
  | "error";

interface FormData {
  studentAddress: string;
  tokenId: string;
}

interface FormErrors {
  studentAddress?: string;
  tokenId?: string;
}

function formatDegree(degreeValue: string): string {
  const degree = DEGREE_OPTIONS.find((d) => d.value === degreeValue);
  return degree?.label || degreeValue;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function VerifierPage() {
  const { isConnected, isCorrectNetwork } = useWallet();
  const [formData, setFormData] = useState<FormData>({
    studentAddress: "",
    tokenId: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [verificationState, setVerificationState] =
    useState<VerificationState>("idle");
  const [result, setResult] = useState<VerifyCredentialResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDisabled = !isConnected || !isCorrectNetwork;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.studentAddress) {
      newErrors.studentAddress = "Student wallet address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.studentAddress)) {
      newErrors.studentAddress = "Invalid Ethereum address format";
    }

    if (!formData.tokenId) {
      newErrors.tokenId = "Token ID is required";
    } else if (isNaN(parseInt(formData.tokenId)) || parseInt(formData.tokenId) < 0) {
      newErrors.tokenId = "Please enter a valid token ID";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) return;

    setVerificationState("loading");

    try {
      const response = await verifyCredential(
        checksumAddress(formData.studentAddress),
        parseInt(formData.tokenId)
      );
      setResult(response);

      if (!response.is_owner) {
        setVerificationState("mismatch");
      } else if (response.is_revoked) {
        setVerificationState("revoked");
      } else if (response.is_valid) {
        setVerificationState("valid");
      } else {
        setVerificationState("error");
        setErrorMessage("Credential validation failed");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to verify credential";
      setErrorMessage(message);
      setVerificationState("error");
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="flex flex-1 p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row">
        {/* Left Panel - Form */}
        <div className="w-full lg:w-1/3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-xl font-semibold">Verify Credential</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Enter the student wallet address and token ID to verify an
              academic credential on the blockchain.
            </p>

            <form onSubmit={handleVerify} className="space-y-4">
              {/* Student Address */}
              <div className="space-y-2">
                <Label htmlFor="verifyStudentAddress">
                  Student Wallet Address
                </Label>
                <Input
                  id="verifyStudentAddress"
                  placeholder="0x..."
                  value={formData.studentAddress}
                  onChange={(e) => updateField("studentAddress", e.target.value)}
                  disabled={isDisabled}
                  className={errors.studentAddress ? "border-destructive" : ""}
                />
                {errors.studentAddress && (
                  <p className="text-sm text-destructive">
                    {errors.studentAddress}
                  </p>
                )}
              </div>

              {/* Token ID */}
              <div className="space-y-2">
                <Label htmlFor="verifyTokenId">Token ID</Label>
                <Input
                  id="verifyTokenId"
                  type="number"
                  placeholder="0"
                  value={formData.tokenId}
                  onChange={(e) => updateField("tokenId", e.target.value)}
                  disabled={isDisabled}
                  className={errors.tokenId ? "border-destructive" : ""}
                />
                {errors.tokenId && (
                  <p className="text-sm text-destructive">{errors.tokenId}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isDisabled || verificationState === "loading"}
              >
                {verificationState === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Verify Credential
                  </>
                )}
              </Button>

              {isDisabled && (
                <p className="text-center text-sm text-muted-foreground">
                  {!isConnected
                    ? "Connect your wallet to verify credentials"
                    : "Switch to Sepolia network to verify"}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="flex-1">
          <div className="h-full rounded-2xl border border-border bg-card p-6">
            {/* Idle State */}
            {verificationState === "idle" && (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium">
                  No Verification Yet
                </h3>
                <p className="max-w-sm text-muted-foreground">
                  Enter a student wallet address and token ID to verify an
                  academic credential on the blockchain.
                </p>
              </div>
            )}

            {/* Loading State */}
            {verificationState === "loading" && (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
                <h3 className="mb-2 text-lg font-medium">
                  Checking the blockchain...
                </h3>
                <p className="text-muted-foreground">
                  Verifying credential authenticity
                </p>
              </div>
            )}

            {/* Valid State */}
            {verificationState === "valid" && result?.credential && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 rounded-xl bg-success/10 p-4">
                  <ShieldCheck className="h-10 w-10 text-success" />
                  <div>
                    <h3 className="text-lg font-semibold text-success">
                      Credential Valid
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This credential is authentic and active
                    </p>
                  </div>
                </div>

                <DataTable result={result} />
              </div>
            )}

            {/* Revoked State */}
            {verificationState === "revoked" && result?.credential && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 rounded-xl bg-destructive/10 p-4">
                  <ShieldX className="h-10 w-10 text-destructive" />
                  <div>
                    <h3 className="text-lg font-semibold text-destructive">
                      Credential Revoked
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This credential has been revoked by the issuer
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                  This credential is no longer valid. Contact the issuing
                  institution for more information.
                </div>

                <DataTable result={result} />
              </div>
            )}

            {/* Ownership Mismatch State */}
            {verificationState === "mismatch" && result && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 rounded-xl bg-warning/10 p-4">
                  <AlertTriangle className="h-10 w-10 text-warning" />
                  <div>
                    <h3 className="text-lg font-semibold text-warning">
                      Ownership Mismatch
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      The credential does not belong to this wallet address
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  The token ID exists, but it is not owned by the provided
                  wallet address. Please verify the student wallet address and
                  try again.
                </p>
              </div>
            )}

            {/* Error State */}
            {verificationState === "error" && (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-destructive">
                  Verification Failed
                </h3>
                <p className="max-w-sm text-muted-foreground">{errorMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Data table component for displaying credential details
function DataTable({ result }: { result: VerifyCredentialResponse }) {
  const credential = result.credential;
  if (!credential) return null;

  const rows = [
    { label: "Student Name", value: credential.metadata.student_name },
    { label: "Degree", value: formatDegree(credential.metadata.degree) },
    { label: "Major", value: credential.metadata.major },
    { label: "Graduation Year", value: credential.metadata.graduation_year },
    { label: "Token ID", value: `#${credential.token_id}` },
    { label: "Issue Date", value: formatDate(credential.issued_at) },
    {
      label: "Hash Match",
      value: result.hash_match,
      isBoolean: true,
    },
    {
      label: "On-Chain Hash",
      value: result.on_chain_hash,
      isHash: true,
    },
  ];

  return (
    <div className="rounded-xl border border-border">
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="text-sm text-muted-foreground">{row.label}</span>
            {row.isBoolean ? (
              <span className="flex items-center gap-1.5">
                {row.value ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-success">
                      Verified
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">
                      Mismatch
                    </span>
                  </>
                )}
              </span>
            ) : row.isHash ? (
              <code className="max-w-[200px] truncate rounded bg-muted px-2 py-1 font-mono text-xs">
                {String(row.value)}
              </code>
            ) : (
              <span className="text-sm font-medium">{String(row.value)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
