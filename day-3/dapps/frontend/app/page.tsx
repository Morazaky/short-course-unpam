'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useBalance,
  useChainId,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { injected } from 'wagmi/connectors';

// ==============================
// 🔹 CONFIG
// ==============================

// 👉 GANTI dengan contract address hasil deploy kamu day 2
const CONTRACT_ADDRESS = '0x4bB0E13161ABFbBB95b6C93efFB4B20759c1b474';

// Avalanche Fuji Testnet chainId
const AVALANCHE_FUJI_CHAIN_ID = 43113;

// 👉 ABI SIMPLE STORAGE
const SIMPLE_STORAGE_ABI = [
  {
    inputs: [],
    name: 'getValue',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_value', type: 'uint256' }],
    name: 'setValue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export default function Page() {
  // ==============================
  // 🔹 WALLET STATE
  // ==============================
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  
  // Get balance
  const { data: balanceData } = useBalance({
    address: address,
  });

  // ==============================
  // 🔹 LOCAL STATE
  // ==============================
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'pending';
  }>({ show: false, message: '', type: 'success' });

  // ==============================
  // 🔹 READ CONTRACT
  // ==============================
  const {
    data: value,
    isLoading: isReading,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIMPLE_STORAGE_ABI,
    functionName: 'getValue',
  });

  // ==============================
  // 🔹 WRITE CONTRACT
  // ==============================
  const {
    writeContract,
    isPending: isWriting,
    data: hash,
    error: writeError,
  } = useWriteContract();

  // Wait for transaction confirmation
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Show toast notifications based on transaction status
  useEffect(() => {
    if (isWriting) {
      queueMicrotask(() => {
        setToast({
          show: true,
          message: '⏳ Transaction pending... Please confirm in wallet',
          type: 'pending',
        });
      });
    }
  }, [isWriting]);

  useEffect(() => {
    if (isConfirming) {
      queueMicrotask(() => {
        setToast({
          show: true,
          message: '⏳ Waiting for confirmation on blockchain...',
          type: 'pending',
        });
      });
    }
  }, [isConfirming]);

  useEffect(() => {
    if (isConfirmed) {
      queueMicrotask(() => {
        setToast({
          show: true,
          message: '✅ Transaction confirmed! Value updated successfully',
          type: 'success',
        });
        refetch(); // Refresh the contract value
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
        setInputValue(''); // Clear input
      });
    }
  }, [isConfirmed, refetch]);

  // Handle write errors (user rejection, etc)
  useEffect(() => {
    if (writeError) {
      queueMicrotask(() => {
        let errorMsg = 'Transaction failed';
        
        // User rejected transaction
        if (writeError.message.includes('User rejected') || 
            writeError.message.includes('user rejected') ||
            writeError.message.includes('User denied')) {
          errorMsg = '❌ Transaction rejected by user';
        } 
        // Wrong network
        else if (writeError.message.includes('chain')) {
          errorMsg = '❌ Wrong network! Please switch to Avalanche Fuji';
        }
        // Generic error
        else {
          errorMsg = `❌ Transaction failed: ${writeError.message.slice(0, 50)}...`;
        }
        
        setError(errorMsg);
        setToast({
          show: true,
          message: errorMsg,
          type: 'error',
        });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
      });
    }
  }, [writeError]);

  // Handle confirmation errors (transaction revert)
  useEffect(() => {
    if (confirmError) {
      queueMicrotask(() => {
        const errorMsg = '❌ Transaction reverted! Please check contract state and try again';
        setError(errorMsg);
        setToast({
          show: true,
          message: errorMsg,
          type: 'error',
        });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
      });
    }
  }, [confirmError]);

  const handleSetValue = async () => {
    if (!inputValue) return;

    // Check if connected to correct network
    if (!isCorrectNetwork) {
      const errorMsg = '❌ Wrong network! Please switch to Avalanche Fuji Testnet';
      setError(errorMsg);
      setToast({
        show: true,
        message: errorMsg,
        type: 'error',
      });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
      return;
    }

    try {
      setError('');
      setToast({ show: false, message: '', type: 'success' });
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'setValue',
        args: [BigInt(inputValue)],
      });
    } catch (err) {
      const errorMsg = (err as Error).message || 'Failed to update value';
      setError(errorMsg);
      setToast({
        show: true,
        message: `❌ ${errorMsg}`,
        type: 'error',
      });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
    }
  };

  // ==============================
  // 🔹 HELPER FUNCTIONS
  // ==============================
  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isCorrectNetwork = chainId === AVALANCHE_FUJI_CHAIN_ID;

  // Transaction is pending if writing or confirming
  const isTxPending = isWriting || isConfirming;

  // ==============================
  // 🔹 UI
  // ==============================
  return (
    <main 
      className="min-h-screen flex flex-col items-center justify-center py-8 px-4"
      style={{
        background: 'linear-gradient(135deg, #1a1a1a, #2d2416, #1a1508)',
      }}
    >
      {/* Toast Notification */}
      {toast.show && (
        <div 
          className="fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-3 max-w-md animate-slide-in"
          style={{
            background: 
              toast.type === 'success' 
                ? 'rgba(76, 193, 55, 0.15)' 
                : toast.type === 'error'
                ? 'rgba(220, 38, 38, 0.15)'
                : 'rgba(212, 175, 55, 0.15)',
            border: `1px solid ${
              toast.type === 'success' 
                ? 'rgba(76, 193, 55, 0.4)' 
                : toast.type === 'error'
                ? 'rgba(220, 38, 38, 0.4)'
                : 'rgba(212, 175, 55, 0.4)'
            }`,
            color: 
              toast.type === 'success' 
                ? '#4cd137' 
                : toast.type === 'error'
                ? '#fca5a5'
                : '#d4af37',
          }}
        >
          <span className="text-sm flex-1">{toast.message}</span>
          <button
            onClick={() => setToast({ show: false, message: '', type: 'success' })}
            className="text-lg"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}
      {/* Info Container */}
      <div 
        className="w-full max-w-md mb-4 p-3 rounded-lg text-center text-sm"
        style={{
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
        }}
      >
        <p className="m-1.5"><strong>MOCHAMMAD RAFI ADZAKY</strong></p>
        <p className="m-1.5"><strong>221011402867</strong></p>
      </div>

      {/* Main Container */}
      <div 
        className="w-full max-w-md p-6 rounded-xl text-center"
        style={{
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
        }}
      >
        <h1 className="text-2xl font-bold mb-1">❄️ Avalanche dApp</h1>
        <p className="text-sm opacity-80 mt-0 mb-4">Connect Wallet & Interact with Smart Contract</p>

        {/* ==========================
            ERROR BOX
        ========================== */}
        {error && (
          <div 
            className="p-3 rounded-lg mb-4 flex items-center gap-2 text-sm"
            style={{
              background: 'rgba(220, 38, 38, 0.15)',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              color: '#fca5a5',
            }}
          >
            <span className="text-lg">⚠️</span>
            <span className="flex-1 text-left">{error}</span>
            <button 
              onClick={() => setError('')}
              className="text-lg"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fca5a5',
                cursor: 'pointer',
                padding: 0,
                width: 'auto',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ==========================
            WALLET CONNECT/DISCONNECT BUTTON
        ========================== */}
        {!isConnected ? (
          <button
            onClick={() => connect({ connector: injected() })}
            disabled={isConnecting}
            className="w-full py-3 px-4 rounded-lg font-bold text-base mb-4 transition-all"
            style={{
              background: '#d4af37',
              color: '#1a1a1a',
              border: '1px solid #d4af37',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              opacity: isConnecting ? 0.6 : 1,
            }}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <button
            onClick={() => disconnect()}
            className="w-full py-3 px-4 rounded-lg font-bold text-base mb-4 transition-all"
            style={{
              background: '#dc2626',
              color: '#fff',
              border: '1px solid #dc2626',
              cursor: 'pointer',
            }}
          >
            Disconnect Wallet
          </button>
        )}

        {/* ==========================
            WALLET INFO CARD
        ========================== */}
        <div 
          className="p-4 rounded-lg text-sm text-left mb-4"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
          }}
        >
          <p className="mb-2">
            <strong>Status:</strong>{' '}
            <span style={{ color: isConnected ? '#4cd137' : '#fff' }}>
              {isConnected ? 'Connected ✅' : 'Not Connected'}
            </span>
          </p>
          <p className="mb-2"><strong>Wallet Address:</strong></p>
          <p className="font-mono text-xs mb-2">
            {address ? shortenAddress(address) : '-'}
          </p>
          <p className="mb-2">
            <strong>Network:</strong>{' '}
            <span style={{ color: isCorrectNetwork ? '#4cd137' : '#fbc531' }}>
              {isConnected 
                ? (isCorrectNetwork ? 'Avalanche Fuji Testnet' : 'Wrong Network ❌')
                : '-'
              }
            </span>
          </p>
          <p>
            <strong>Balance:</strong>{' '}
            {balanceData 
              ? `${(Number(balanceData.value) / 1e18).toFixed(4)} ${balanceData.symbol}`
              : '-'
            }
          </p>
        </div>

        {/* ==========================
            SMART CONTRACT INTERACTION
        ========================== */}
        {isConnected && isCorrectNetwork && (
          <>
            {/* READ CONTRACT */}
            <div 
              className="p-4 rounded-lg mb-4"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
              }}
            >
              <p className="text-sm text-gray-400 mb-2">Contract Value (Read)</p>
              
              {isReading ? (
                <p className="text-xl">Loading...</p>
              ) : (
                <p className="text-3xl font-bold" style={{ color: '#d4af37' }}>
                  {value?.toString() || '0'}
                </p>
              )}

              <button
                onClick={() => refetch()}
                className="text-xs mt-2 px-3 py-1 rounded"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  color: '#d4af37',
                  cursor: 'pointer',
                }}
              >
                 Refresh Value
              </button>
            </div>

            {/* WRITE CONTRACT */}
            <div 
              className="p-4 rounded-lg"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
              }}
            >
              <p className="text-sm text-gray-400 mb-3">Update Contract Value</p>

              <input
                type="number"
                placeholder="Enter new value"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full p-2 rounded mb-3 text-sm"
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#fff',
                }}
              />

              <button
                onClick={handleSetValue}
                disabled={isTxPending || !inputValue}
                className="w-full py-2 px-4 rounded-lg font-bold text-sm transition-all"
                style={{
                  background: isTxPending || !inputValue ? '#6b6b6b' : '#d4af37',
                  color: isTxPending || !inputValue ? '#a0a0a0' : '#1a1a1a',
                  border: `1px solid ${isTxPending || !inputValue ? '#6b6b6b' : '#d4af37'}`,
                  cursor: isTxPending || !inputValue ? 'not-allowed' : 'pointer',
                  opacity: isTxPending || !inputValue ? 0.6 : 1,
                }}
              >
                {isTxPending 
                  ? (isWriting ? '⏳ Pending Wallet...' : '⏳ Confirming...') 
                  : 'Set Value'
                }
              </button>

              {/* Transaction Hash */}
              {hash && (
                <div className="mt-3 text-xs">
                  <p className="text-gray-400 mb-1">Transaction Hash:</p>
                  <a
                    href={`https://testnet.snowtrace.io/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono break-all underline"
                    style={{ color: '#d4af37' }}
                  >
                    {hash.slice(0, 10)}...{hash.slice(-8)}
                  </a>
                  <p className="text-gray-500 mt-1">
                    {isConfirming && '⏳ Confirming...'}
                    {isConfirmed && '✅ Confirmed'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Network Warning */}
        {isConnected && !isCorrectNetwork && (
          <div 
            className="p-4 rounded-lg mt-4"
            style={{
              background: 'rgba(251, 197, 49, 0.15)',
              border: '1px solid rgba(251, 197, 49, 0.4)',
            }}
          >
            <p className="text-sm mb-2" style={{ color: '#fbc531' }}>
              ⚠️ <strong>Wrong Network Detected</strong>
            </p>
            <p className="text-xs" style={{ color: '#fbc531', opacity: 0.9 }}>
              You are connected to the wrong network. Please switch to <strong>Avalanche Fuji Testnet</strong> in your wallet to interact with the smart contract.
            </p>
            <div className="mt-3 text-xs" style={{ color: '#fbc531', opacity: 0.8 }}>
              <p>Network ID: 43113</p>
              <p>RPC: https://api.avax-test.network/ext/bc/C/rpc</p>
            </div>
          </div>
        )}

        {/* ==========================
            FOOTNOTE
        ========================== */}
        <p className="text-xs text-gray-500 mt-4">
          Smart contract = single source of truth
        </p>
      </div>
    </main>
  );
}
