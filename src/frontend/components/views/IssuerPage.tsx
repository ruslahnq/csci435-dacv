"use client";

import { AddressDisplay } from "@/components/AddressDisplay";
import { CredentialCardSkeleton } from "@/components/LoadingSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { checksumAddress, useWallet } from "@/lib/WalletContext";
import {
  getAllCredentials,
  issueCredential,
  revokeCredential,
  type Credential,
  type IssueCredentialResponse,
  type RevokeCredentialResponse,
} from "@/lib/api";
import { DEGREE_OPTIONS } from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Hash,
  Loader2,
  RefreshCw,
  Search,
  ShieldX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type IssuerMode = "issue" | "revoke";
type LoadingState = "idle" | "loading" | "success" | "error";

interface FormData {
  studentAddress: string;
  studentName: string;
  degree: string;
  major: string;
  graduationYear: string;
  gpa: string;
  notes: string;
}

interface FormErrors {
  studentAddress?: string;
  studentName?: string;
  degree?: string;
  major?: string;
  graduationYear?: string;
}

interface RevokeFormData {
  tokenId: string;
}

interface RevokeFormErrors {
  tokenId?: string;
}

const initialFormData: FormData = {
  studentAddress: "",
  studentName: "",
  degree: "",
  major: "",
  graduationYear: "",
  gpa: "",
  notes: "",
};

const initialRevokeFormData: RevokeFormData = {
  tokenId: "",
};

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

function RecentCredentialRow({
  credential,
  onSelectToken,
}: {
  credential: Credential;
  onSelectToken: (tokenId: number) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        credential.is_active
          ? "border-border bg-card hover:border-primary/50 hover:shadow-sm"
          : "border-border bg-muted/30"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge isActive={credential.is_active} />
            <span className="text-xs text-muted-foreground">
              Token #{credential.token_id}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {credential.metadata.student_name}
            </h3>
            <p className="text-sm text-primary">
              {formatDegree(credential.metadata.degree)} · {credential.metadata.major}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Class of {credential.metadata.graduation_year}</span>
            <span>Issued {formatDate(credential.issued_at)}</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectToken(credential.token_id)}
          disabled={!credential.is_active}
          className="shrink-0"
        >
          {credential.is_active ? "Use Token" : "Already Revoked"}
        </Button>
      </div>
    </div>
  );
}

export function IssuerPage() {
  const { isConnected, isCorrectNetwork } = useWallet();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [activeMode, setActiveMode] = useState<IssuerMode>("issue");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<IssueCredentialResponse | null>(null);
  const [revokeFormData, setRevokeFormData] = useState<RevokeFormData>(
    initialRevokeFormData
  );
  const [revokeErrors, setRevokeErrors] = useState<RevokeFormErrors>({});
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [revokeSuccess, setRevokeSuccess] = useState<RevokeCredentialResponse | null>(
    null
  );
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credentialsState, setCredentialsState] = useState<LoadingState>("idle");
  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  const selectedCredential = useMemo(() => {
    const tokenId = parseInt(revokeFormData.tokenId, 10);
    if (isNaN(tokenId)) {
      return null;
    }

    return credentials.find((credential) => credential.token_id === tokenId) ?? null;
  }, [credentials, revokeFormData.tokenId]);

  const isDisabled = !isConnected || !isCorrectNetwork;

  const fetchCredentials = async () => {
    setCredentialsState("loading");
    setCredentialsError(null);

    try {
      const data = await getAllCredentials();
      setCredentials(data);
      setCredentialsState("success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch credentials";
      setCredentialsError(message);
      setCredentialsState("error");
    }
  };

  useEffect(() => {
    if (activeMode === "revoke") {
      void fetchCredentials();
    }
  }, [activeMode]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.studentAddress) {
      newErrors.studentAddress = "Student wallet address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.studentAddress)) {
      newErrors.studentAddress = "Invalid Ethereum address format";
    }

    if (!formData.studentName.trim()) {
      newErrors.studentName = "Student name is required";
    }

    if (!formData.degree) {
      newErrors.degree = "Please select a degree";
    }

    if (!formData.major.trim()) {
      newErrors.major = "Major is required";
    }

    if (!formData.graduationYear) {
      newErrors.graduationYear = "Graduation year is required";
    } else {
      const year = parseInt(formData.graduationYear, 10);
      if (isNaN(year) || year < 1900 || year > 2100) {
        newErrors.graduationYear = "Please enter a valid year";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRevokeForm = (): boolean => {
    const newErrors: RevokeFormErrors = {};

    if (!revokeFormData.tokenId) {
      newErrors.tokenId = "Token ID is required";
    } else {
      const tokenId = parseInt(revokeFormData.tokenId, 10);
      if (isNaN(tokenId) || tokenId < 0) {
        newErrors.tokenId = "Please enter a valid token ID";
      }
    }

    setRevokeErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const result = await issueCredential({
        student_address: checksumAddress(formData.studentAddress),
        student_name: formData.studentName.trim(),
        degree: formData.degree,
        major: formData.major.trim(),
        graduation_year: parseInt(formData.graduationYear, 10),
        gpa: formData.gpa.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });
      setSuccess(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to issue credential";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevokeError(null);

    if (!validateRevokeForm()) return;

    setIsRevoking(true);

    try {
      const result = await revokeCredential(parseInt(revokeFormData.tokenId, 10));
      setRevokeSuccess(result);
      await fetchCredentials();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to revoke credential";
      setRevokeError(message);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setErrors({});
    setSubmitError(null);
    setSuccess(null);
  };

  const handleRevokeReset = () => {
    setRevokeFormData(initialRevokeFormData);
    setRevokeErrors({});
    setRevokeError(null);
    setRevokeSuccess(null);
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const updateRevokeField = (value: string) => {
    setRevokeFormData({ tokenId: value });
    if (revokeErrors.tokenId) {
      setRevokeErrors((prev) => ({ ...prev, tokenId: undefined }));
    }
  };

  const handleSelectToken = (tokenId: number) => {
    updateRevokeField(tokenId.toString());
    setActiveMode("revoke");
  };

  const renderIssueSuccess = () => (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold">
            Credential Issued Successfully
          </h2>
          <p className="mb-6 text-muted-foreground">
            The academic credential has been minted and stored on the blockchain.
          </p>

          <div className="mb-6 space-y-4 rounded-xl bg-muted/50 p-4 text-left">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                Token ID
              </span>
              <span className="font-mono font-medium">#{success?.token_id}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Transaction Hash
              </span>
              {success?.transaction_hash && (
                <AddressDisplay
                  address={success.transaction_hash}
                  type="tx"
                  truncate={true}
                />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Metadata URI</span>
              <code className="break-all rounded bg-muted px-2 py-1 font-mono text-xs">
                {success?.metadata_uri}
              </code>
            </div>
          </div>

          <Button onClick={handleReset} className="w-full">
            Issue Another Credential
          </Button>
        </div>
      </div>
    </div>
  );

  const renderRevokeSuccess = () => (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold">
            Credential Revoked Successfully
          </h2>
          <p className="mb-6 text-muted-foreground">
            The credential has been marked inactive on-chain and in the database.
          </p>

          <div className="mb-6 space-y-4 rounded-xl bg-background/60 p-4 text-left">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                Token ID
              </span>
              <span className="font-mono font-medium">#{revokeSuccess?.token_id}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Transaction Hash
              </span>
              {revokeSuccess?.transaction_hash && (
                <AddressDisplay
                  address={revokeSuccess.transaction_hash}
                  type="tx"
                  truncate={true}
                />
              )}
            </div>
          </div>

          <Button variant="destructive" onClick={handleRevokeReset} className="w-full">
            Revoke Another Credential
          </Button>
        </div>
      </div>
    </div>
  );

  const renderIssuePanel = () => {
    if (success) {
      return renderIssueSuccess();
    }

    return (
      <div className="flex flex-1 items-start justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold">Issue Academic Credential</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Metadata is stored off-chain. Only the hash is written to the blockchain.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="studentAddress">
                  Student Wallet Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="studentAddress"
                  placeholder="0x..."
                  value={formData.studentAddress}
                  onChange={(e) => updateField("studentAddress", e.target.value)}
                  disabled={isDisabled}
                  className={errors.studentAddress ? "border-destructive" : ""}
                />
                {errors.studentAddress && (
                  <p className="text-sm text-destructive">{errors.studentAddress}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentName">
                  Student Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="studentName"
                  placeholder="John Doe"
                  value={formData.studentName}
                  onChange={(e) => updateField("studentName", e.target.value)}
                  disabled={isDisabled}
                  className={errors.studentName ? "border-destructive" : ""}
                />
                {errors.studentName && (
                  <p className="text-sm text-destructive">{errors.studentName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="degree">
                  Degree <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.degree}
                  onValueChange={(value) => updateField("degree", value)}
                  disabled={isDisabled}
                >
                  <SelectTrigger
                    id="degree"
                    className={errors.degree ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select a degree" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.degree && (
                  <p className="text-sm text-destructive">{errors.degree}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="major">
                  Major <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="major"
                  placeholder="Computer Science"
                  value={formData.major}
                  onChange={(e) => updateField("major", e.target.value)}
                  disabled={isDisabled}
                  className={errors.major ? "border-destructive" : ""}
                />
                {errors.major && (
                  <p className="text-sm text-destructive">{errors.major}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationYear">
                  Graduation Year <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="graduationYear"
                  type="number"
                  placeholder="2024"
                  value={formData.graduationYear}
                  onChange={(e) => updateField("graduationYear", e.target.value)}
                  disabled={isDisabled}
                  className={errors.graduationYear ? "border-destructive" : ""}
                />
                {errors.graduationYear && (
                  <p className="text-sm text-destructive">{errors.graduationYear}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gpa">GPA (Optional)</Label>
                <Input
                  id="gpa"
                  placeholder="3.85"
                  value={formData.gpa}
                  onChange={(e) => updateField("gpa", e.target.value)}
                  disabled={isDisabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this credential..."
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  disabled={isDisabled}
                  rows={3}
                />
              </div>

              {submitError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {submitError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isDisabled || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Issuing...
                  </>
                ) : (
                  "Issue Credential"
                )}
              </Button>

              {isDisabled && isConnected && (
                <p className="text-center text-sm text-muted-foreground">
                  Please switch to Sepolia network to issue credentials
                </p>
              )}
              {!isConnected && (
                <p className="text-center text-sm text-muted-foreground">
                  Please connect your wallet to issue credentials
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderRevokePanel = () => {
    if (revokeSuccess) {
      return renderRevokeSuccess();
    }

    return (
      <div className="flex flex-1 p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
          <div className="w-full lg:w-105">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold">Revoke Academic Credential</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter a token ID to revoke the credential on-chain. This action is irreversible.
                </p>
              </div>

              <form onSubmit={handleRevokeSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="tokenId">
                    Token ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tokenId"
                    type="number"
                    placeholder="123"
                    value={revokeFormData.tokenId}
                    onChange={(e) => updateRevokeField(e.target.value)}
                    disabled={isDisabled}
                    className={revokeErrors.tokenId ? "border-destructive" : ""}
                  />
                  {revokeErrors.tokenId && (
                    <p className="text-sm text-destructive">{revokeErrors.tokenId}</p>
                  )}
                </div>

                {selectedCredential && (
                  <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">
                        Selected Credential
                      </h3>
                      <StatusBadge isActive={selectedCredential.is_active} />
                    </div>

                    <div className="grid gap-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Student</span>
                        <span className="text-right font-medium text-foreground">
                          {selectedCredential.metadata.student_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Degree</span>
                        <span className="text-right font-medium text-foreground">
                          {formatDegree(selectedCredential.metadata.degree)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Major</span>
                        <span className="text-right font-medium text-foreground">
                          {selectedCredential.metadata.major}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Graduation Year</span>
                        <span className="text-right font-medium text-foreground">
                          {selectedCredential.metadata.graduation_year}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Issued At</span>
                        <span className="text-right font-medium text-foreground">
                          {formatDate(selectedCredential.issued_at)}
                        </span>
                      </div>
                    </div>

                    {selectedCredential.transaction_hash && (
                      <div className="space-y-2">
                        <span className="text-xs text-muted-foreground">
                          Transaction Hash
                        </span>
                        <AddressDisplay
                          address={selectedCredential.transaction_hash}
                          type="tx"
                          truncate={true}
                          showCopy={true}
                          showEtherscan={true}
                        />
                      </div>
                    )}
                  </div>
                )}

                {!selectedCredential &&
                  revokeFormData.tokenId &&
                  credentialsState === "success" && (
                    <p className="text-sm text-muted-foreground">
                      No cached metadata found for this token ID yet.
                    </p>
                  )}

                <div className="rounded-xl border border-warning/50 bg-warning/15 p-4 text-sm text-warning">
                  Revocations cannot be undone. Double-check the token ID before submitting.
                </div>

                {revokeError && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {revokeError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-destructive/80 hover:bg-destructive/90"
                  variant="destructive"
                  disabled={isDisabled || isRevoking}
                >
                  {isRevoking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Revoking...
                    </>
                  ) : (
                    "Revoke Credential"
                  )}
                </Button>

                {isDisabled && isConnected && (
                  <p className="text-center text-sm text-muted-foreground">
                    Please switch to Sepolia network to revoke credentials
                  </p>
                )}
                {!isConnected && (
                  <p className="text-center text-sm text-muted-foreground">
                    Please connect your wallet to revoke credentials
                  </p>
                )}
              </form>
            </div>
          </div>

          <div className="flex-1">
            <div
              className="flex flex-col rounded-2xl border border-border bg-card p-6"
              style={{ height: "36rem" }}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Recent Credentials</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose a token to prefill the revoke form.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={fetchCredentials}
                  disabled={credentialsState === "loading"}
                >
                  <RefreshCw
                    className={cn(
                      "mr-2 h-4 w-4",
                      credentialsState === "loading" && "animate-spin"
                    )}
                  />
                  Refresh
                </Button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                {credentialsState === "loading" && (
                  <div className="grid gap-4">
                    {[...Array(3)].map((_, index) => (
                      <CredentialCardSkeleton key={index} />
                    ))}
                  </div>
                )}

                {credentialsState === "error" && (
                  <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-destructive/50 bg-destructive/10 p-12 text-center">
                    <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
                    <h3 className="mb-2 text-lg font-semibold">
                      Failed to Load Credentials
                    </h3>
                    <p className="mb-4 max-w-sm text-muted-foreground">
                      {credentialsError}
                    </p>
                    <Button onClick={fetchCredentials}>Try Again</Button>
                  </div>
                )}

                {credentialsState === "success" && credentials.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-border bg-muted/20 p-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                      No Credentials Found
                    </h3>
                    <p className="max-w-sm text-muted-foreground">
                      There are no issued credentials to revoke yet.
                    </p>
                  </div>
                )}

                {credentialsState === "success" && credentials.length > 0 && (
                  <div className="grid gap-3">
                    {credentials.map((credential) => (
                      <RecentCredentialRow
                        key={credential.token_id}
                        credential={credential}
                        onSelectToken={handleSelectToken}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Issuer Console</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Issue new credentials or revoke an existing token from the same workspace.
            </p>
          </div>
          <Tabs
            value={activeMode}
            onValueChange={(value) => setActiveMode(value as IssuerMode)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid w-full grid-cols-2 md:w-70">
              <TabsTrigger value="issue">Issue</TabsTrigger>
              <TabsTrigger value="revoke">Revoke</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs
          value={activeMode}
          onValueChange={(value) => setActiveMode(value as IssuerMode)}
          className="w-full"
        >
          <TabsContent value="issue" className="mt-0">
            {renderIssuePanel()}
          </TabsContent>
          <TabsContent value="revoke" className="mt-0">
            {renderRevokePanel()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
