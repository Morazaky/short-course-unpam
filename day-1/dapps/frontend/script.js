const connectBtn = document.getElementById("connectBtn");
const statusEl = document.getElementById("status");
const addressEl = document.getElementById("address");
const networkEl = document.getElementById("network");
const balanceEl = document.getElementById("balance");
const errorBox = document.getElementById("errorBox");
const errorMessage = document.getElementById("errorMessage");

// Avalanche Fuji Testnet chainId (hex)
const AVALANCHE_FUJI_CHAIN_ID = "0xa869";

function showError(message) {
  errorMessage.textContent = message;
  errorBox.style.display = "block";
}

function hideError() {
  errorBox.style.display = "none";
}

function shortenAddress(address) {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatAvaxBalance(balanceWei) {
  const balance = parseInt(balanceWei, 16);
  console.log({ balance });
  return (balance / 1e18).toFixed(4);
}

async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    showError("Core Wallet tidak terdeteksi. Silakan install Core Wallet extension terlebih dahulu.");
    return;
  }

  console.log("window.ethereum", window.ethereum);

  try {
    hideError();
    statusEl.textContent = "Connecting...";

    // Request wallet accounts
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const address = accounts[0];
    addressEl.textContent = shortenAddress(address);

    console.log({ address });

    // Get chainId
    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    console.log({ chainId });

    if (chainId === AVALANCHE_FUJI_CHAIN_ID) {
      networkEl.textContent = "Avalanche Fuji Testnet";
      statusEl.textContent = "Connected ✅";
      statusEl.style.color = "#4cd137";

      // Disable button setelah connected
      connectBtn.disabled = true;
      connectBtn.textContent = "Connected";

      // Get AVAX balance
      const balanceWei = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });

      console.log({ balanceWei });

      balanceEl.textContent = formatAvaxBalance(balanceWei);
    } else {
      networkEl.textContent = "Wrong Network ❌";
      statusEl.textContent = "Please switch to Avalanche Fuji";
      statusEl.style.color = "#fbc531";
      balanceEl.textContent = "-";
      showError("Anda terhubung ke network yang salah. Silakan switch ke Avalanche Fuji Testnet di Core Wallet.");
    }
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Connection Failed ❌";
    
    // Tampilkan pesan error yang lebih spesifik
    if (error.code === 4001) {
      showError("Koneksi dibatalkan. Anda menolak permintaan koneksi wallet.");
    } else if (error.code === -32002) {
      showError("Permintaan koneksi sudah tertunda. Silakan cek Core Wallet Anda.");
    } else {
      showError(`Terjadi kesalahan: ${error.message || "Gagal terhubung ke wallet"}`);
    }
  }
}

connectBtn.addEventListener("click", connectWallet);
