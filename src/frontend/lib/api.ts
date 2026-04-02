import { API_BASE_URL } from "./config";

// API Types
export interface CredentialMetadata {
  student_name: string;
  degree: string;
  major: string;
  graduation_year: number;
  gpa?: string;
  notes?: string;
  institution?: string;
}

export interface Credential {
  db_id: number;
  token_id: number;
  student_address: string;
  metadata: CredentialMetadata;
  metadata_uri: string;
  metadata_hash: string;
  is_active: boolean;
  issued_at: string;
  transaction_hash?: string;
}

export interface IssueCredentialRequest {
  student_address: string;
  student_name: string;
  degree: string;
  major: string;
  graduation_year: number;
  gpa?: string;
  notes?: string;
}

export interface IssueCredentialResponse {
  token_id: number;
  transaction_hash: string;
  metadata_uri: string;
  message?: string;
}

export interface VerifyCredentialResponse {
  is_valid: boolean;
  is_owner: boolean;
  is_revoked: boolean;
  credential: Credential | null;
  on_chain_hash: string;
  computed_hash: string;
  hash_match: boolean;
  message: string;
}

export interface RevokeCredentialResponse {
  token_id: number;
  transaction_hash: string;
  message?: string;
}

interface IssueCredentialResponseRaw {
  success?: boolean;
  db_id?: number;
  token_id: number;
  tx_hash?: string;
  transaction_hash?: string;
  metadata_uri: string;
  metadata_hash?: string;
  message?: string;
}

interface RevokeCredentialResponseRaw {
  success?: boolean;
  token_id: number;
  tx_hash?: string;
  transaction_hash?: string;
  message?: string;
}

interface CredentialRecordRaw {
  db_id: number;
  token_id: number;
  student_address?: string;
  student_name: string;
  degree: string;
  major: string;
  graduation_year: number;
  gpa?: string | null;
  notes?: string | null;
  metadata_hash?: string | null;
  is_revoked: boolean;
  issued_at: string;
  tx_hash?: string | null;
}

interface VerifyCredentialResponseRaw {
  valid: boolean;
  revoked: boolean;
  on_chain_hash: string;
  metadata_uri: string;
  hash_match: boolean;
  metadata: {
    student_name: string;
    degree: string;
    major: string;
    graduation_year: number;
    issued_at: string | null;
    revoked_at: string | null;
  } | null;
  student_address: string;
  token_id: number;
}

function mapCredentialRecord(raw: CredentialRecordRaw): Credential {
  return {
    db_id: raw.db_id,
    token_id: raw.token_id,
    student_address: raw.student_address ?? "",
    metadata: {
      student_name: raw.student_name,
      degree: raw.degree,
      major: raw.major,
      graduation_year: raw.graduation_year,
      gpa: raw.gpa ?? undefined,
      notes: raw.notes ?? undefined,
      institution: "University",
    },
    metadata_uri: `${API_BASE_URL}/credentials/${raw.db_id}/metadata`,
    metadata_hash: raw.metadata_hash ?? "",
    is_active: !raw.is_revoked,
    issued_at: raw.issued_at,
    transaction_hash: raw.tx_hash ?? undefined,
  };
}

function mapVerifyResponse(raw: VerifyCredentialResponseRaw): VerifyCredentialResponse {
  return {
    is_valid: raw.valid,
    is_owner: true,
    is_revoked: raw.revoked,
    credential: raw.metadata
      ? {
          db_id: raw.token_id,
          token_id: raw.token_id,
          student_address: raw.student_address,
          metadata: {
            student_name: raw.metadata.student_name,
            degree: raw.metadata.degree,
            major: raw.metadata.major,
            graduation_year: raw.metadata.graduation_year,
            institution: "University",
          },
          metadata_uri: raw.metadata_uri,
          metadata_hash: raw.on_chain_hash,
          is_active: !raw.revoked,
          issued_at: raw.metadata.issued_at ?? new Date().toISOString(),
          transaction_hash: undefined,
        }
      : null,
    on_chain_hash: raw.on_chain_hash,
    computed_hash: raw.on_chain_hash,
    hash_match: raw.hash_match,
    message: raw.valid
      ? "Credential verified successfully"
      : raw.revoked
        ? "Credential has been revoked"
        : "Credential verification failed",
  };
}

export interface ApiError {
  detail: string;
}

// Helper to handle API errors
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: `Request failed with status ${response.status}`,
    }));
    throw new Error(errorData.detail || "An unknown error occurred");
  }
  return response.json();
}

// Issue a new credential
export async function issueCredential(
  data: IssueCredentialRequest
): Promise<IssueCredentialResponse> {
  const response = await fetch(`${API_BASE_URL}/credentials/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const raw = await handleResponse<IssueCredentialResponseRaw>(response);
  return {
    token_id: raw.token_id,
    transaction_hash: raw.transaction_hash ?? raw.tx_hash ?? "",
    metadata_uri: raw.metadata_uri,
    message: raw.message,
  };
}

// Revoke a credential
export async function revokeCredential(
  tokenId: number
): Promise<RevokeCredentialResponse> {
  const response = await fetch(`${API_BASE_URL}/credentials/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token_id: tokenId }),
  });
  const raw = await handleResponse<RevokeCredentialResponseRaw>(response);
  return {
    token_id: raw.token_id,
    transaction_hash: raw.transaction_hash ?? raw.tx_hash ?? "",
    message: raw.message,
  };
}

// Verify a credential
export async function verifyCredential(
  studentAddress: string,
  tokenId: number
): Promise<VerifyCredentialResponse> {
  const params = new URLSearchParams({
    student_address: studentAddress,
    token_id: tokenId.toString(),
  });
  const response = await fetch(
    `${API_BASE_URL}/credentials/verify?${params.toString()}`
  );
  const raw = await handleResponse<VerifyCredentialResponseRaw>(response);
  return mapVerifyResponse(raw);
}

// Get all credentials for a student
export async function getStudentCredentials(
  address: string
): Promise<Credential[]> {
  const response = await fetch(`${API_BASE_URL}/credentials/student/${address}`);
  const raw = await handleResponse<CredentialRecordRaw[]>(response);
  return raw.map(mapCredentialRecord);
}

// Get all credentials
export async function getAllCredentials(): Promise<Credential[]> {
  const response = await fetch(`${API_BASE_URL}/credentials`);
  const raw = await handleResponse<CredentialRecordRaw[]>(response);
  return raw.map(mapCredentialRecord);
}
