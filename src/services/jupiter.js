import axios from "axios";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

export class JupiterApi {
  constructor() {
    this.baseUrl = "https://quote-api.jup.ag/v6";
  }

  async getQuote(inputMint, outputMint, amount, slippageBps = 500) {
    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: Math.floor(amount).toString(),
        slippageBps: slippageBps.toString(),
      });

      console.log(`📡 Jupiter API Request: ${this.baseUrl}/quote?${params}`);

      const response = await axios.get(`${this.baseUrl}/quote?${params}`, {
        timeout: 15000,
        headers: {
          Accept: "application/json",
        },
      });
      console.log("✅ Jupiter quote received, output amount:", response.data.outAmount);
      return response.data;
    } catch (error) {
      console.error("❌ Error getting quote:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", JSON.stringify(error.response.data, null, 2));
      }
      return null;
    }
  }

  async getSwapTransaction(quoteResponse, userPublicKey) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/swap`,
        {
          quoteResponse,
          userPublicKey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto",
        },
        {
          timeout: 20000,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      // Deserialize the transaction - handle both legacy and versioned transactions
      const swapTransactionBuf = Buffer.from(response.data.swapTransaction, "base64");

      let transaction;
      try {
        // Try versioned transaction first
        transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      } catch (error) {
        // Fall back to legacy transaction
        transaction = Transaction.from(swapTransactionBuf);
      }

      console.log("✅ Swap transaction created");
      return transaction;
    } catch (error) {
      console.error("❌ Error getting swap transaction:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", JSON.stringify(error.response.data, null, 2));
      }
      return null;
    }
  }
}
