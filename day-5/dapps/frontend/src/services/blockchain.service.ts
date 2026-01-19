const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
}

/**
 * Get latest blockchain value
 */
export async function getBlockchainValue() {
  try {
    const res = await fetch(`${BACKEND_URL}/blockchain/value`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch blockchain value: ${error.message}`);
    }
    throw new Error("Failed to fetch blockchain value");
  }
}

/**
 * Get blockchain events
 */
export async function getBlockchainEvents() {
  try {
    const res = await fetch(`${BACKEND_URL}/blockchain/events`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch blockchain events: ${error.message}`);
    }
    throw new Error("Failed to fetch blockchain events");
  }
}