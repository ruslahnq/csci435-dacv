"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressDisplay } from "@/components/AddressDisplay";
import { useWallet, checksumAddress } from "@/lib/WalletContext";
import { issueCredential, type IssueCredentialResponse } from "@/lib/api";
import { DEGREE_OPTIONS } from "@/lib/config";

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

const initialFormData: FormData = {
  studentAddress: "",
  studentName: "",
  degree: "",
  major: "",
  graduationYear: "",
  gpa: "",
  notes: "",
};

export function IssuerPage() {
  const { isConnected, isCorrectNetwork } = useWallet();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<IssueCredentialResponse | null>(null);

  const isDisabled = !isConnected || !isCorrectNetwork;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate Ethereum address
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
      const year = parseInt(formData.graduationYear);
      if (isNaN(year) || year < 1900 || year > 2100) {
        newErrors.graduationYear = "Please enter a valid year";
      }
    }

    setErrors(newErrors);
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
        graduation_year: parseInt(formData.graduationYear),
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

  const handleReset = () => {
    setFormData(initialFormData);
    setErrors({});
    setSubmitError(null);
    setSuccess(null);
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Success state
  if (success) {
    return (
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
              The academic credential has been minted and stored on the
              blockchain.
            </p>

            <div className="mb-6 space-y-4 rounded-xl bg-muted/50 p-4 text-left">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  Token ID
                </span>
                <span className="font-mono font-medium">
                  #{success.token_id}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Transaction Hash
                </span>
                <AddressDisplay
                  address={success.transaction_hash}
                  type="tx"
                  truncate={true}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">
                  Metadata URI
                </span>
                <code className="break-all rounded bg-muted px-2 py-1 font-mono text-xs">
                  {success.metadata_uri}
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
  }

  return (
    <div className="flex flex-1 items-start justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold">Issue Academic Credential</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Metadata is stored off-chain. Only the hash is written to the
              blockchain.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student Address */}
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

            {/* Student Name */}
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

            {/* Degree */}
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

            {/* Major */}
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

            {/* Graduation Year */}
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

            {/* GPA (Optional) */}
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

            {/* Notes (Optional) */}
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

            {/* Submit Error */}
            {submitError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {submitError}
              </div>
            )}

            {/* Submit Button */}
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
}
