"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { SEPOLIA_CHAIN_ID, NETWORKS } from "./config";

// Ethereum provider types
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (
    event: string,
    callback: (...args: unknown[]) => void
  ) => void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  networkName: string | null;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Utility to checksum an Ethereum address (EIP-55)
export function checksumAddress(address: string): string {
  // Simple validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("Invalid Ethereum address format");
  }
  // For proper checksum, we'd use ethers.js or web3.js
  // For now, return lowercase for consistency
  return address.toLowerCase();
}

// Truncate address for display
export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isCorrectNetwork: false,
    networkName: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateWalletState = useCallback(
    (address: string | null, chainId: number | null) => {
      const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;
      const networkName = chainId ? NETWORKS[chainId] || `Chain ${chainId}` : null;

      setWalletState({
        address,
        chainId,
        isConnected: !!address,
        isCorrectNetwork,
        networkName,
      });
    },
    []
  );

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask to connect your wallet");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      const chainIdHex = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;

      const chainId = parseInt(chainIdHex, 16);
      const address = accounts[0] ? checksumAddress(accounts[0]) : null;

      updateWalletState(address, chainId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }, [updateWalletState]);

  const disconnect = useCallback(() => {
    setWalletState({
      address: null,
      chainId: null,
      isConnected: false,
      isCorrectNetwork: false,
      networkName: null,
    });
    setError(null);
  }, []);

  // Listen to MetaMask events
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (accountsArray.length === 0) {
        disconnect();
      } else {
        const address = checksumAddress(accountsArray[0]);
        setWalletState((prev) => ({
          ...prev,
          address,
          isConnected: true,
        }));
      }
    };

    const handleChainChanged = (chainIdHex: unknown) => {
      const chainId = parseInt(chainIdHex as string, 16);
      const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;
      const networkName = NETWORKS[chainId] || `Chain ${chainId}`;

      setWalletState((prev) => ({
        ...prev,
        chainId,
        isCorrectNetwork,
        networkName,
      }));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Check if already connected
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const accountsArray = accounts as string[];
        if (accountsArray.length > 0) {
          window.ethereum!.request({ method: "eth_chainId" }).then((chainIdHex) => {
            const chainId = parseInt(chainIdHex as string, 16);
            const address = checksumAddress(accountsArray[0]);
            updateWalletState(address, chainId);
          });
        }
      })
      .catch(console.error);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect, updateWalletState]);

  return (
    <WalletContext.Provider
      value={{
        ...walletState,
        connect,
        disconnect,
        isConnecting,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
