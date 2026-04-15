"use client";


interface AddressDisplayProps {
  address?: string | null;
  type?: "address" | "tx";
  truncate?: boolean;
  showCopy?: boolean;
  showEtherscan?: boolean;
  className?: string;
}
