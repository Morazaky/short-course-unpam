import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createPublicClient, http, PublicClient } from 'viem';
import { avalancheFuji } from 'viem/chains';
import SIMPLE_STORAGE from './simple-storage.json';

@Injectable()
export class BlockchainService {
  private client: PublicClient;
  private contractAddress: `0x${string}`;

  constructor() {
    this.client = createPublicClient({
      chain: avalancheFuji,
      transport: http('https://api.avax-test.network/ext/bc/C/rpc'),
    });

    // GANTI dengan address hasil deploy Day 2
    this.contractAddress =
      '0x4bB0E13161ABFbBB95b6C93efFB4B20759c1b474' as `0x${string}`;
  }

  // 🔹 Read latest value
  async getLatestValue() {
    try {
      const value: bigint = (await this.client.readContract({
        address: this.contractAddress,
        abi: SIMPLE_STORAGE.abi,
        functionName: 'getValue',
      })) as bigint;

      return {
        value: value.toString(),
      };
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  // 🔹 Read ValueUpdated events dengan pagination
  async getValueUpdatedEvents(
    fromBlock: number,
    toBlock: number,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      // Sebelum eksekusi, pastikan (toBlock - fromBlock) < 2048
      // Jika lebih, kembali ke client dan minta rentang blok yang lebih kecil
      const blockRange = toBlock - fromBlock;
      if (blockRange >= 2048) {
        throw new BadRequestException(
          `Rentang blok terlalu besar (${blockRange} blok). Maksimal 2047 blok per request.`,
        );
      }

      // Validasi pagination parameters
      if (page < 1) {
        throw new BadRequestException('Page harus >= 1');
      }
      if (limit < 1 || limit > 100) {
        throw new BadRequestException('Limit harus antara 1-100');
      }

      const events = await this.client.getLogs({
        address: this.contractAddress,
        event: {
          type: 'event',
          name: 'ValueUpdated',
          inputs: [
            {
              name: 'newValue',
              type: 'uint256',
              indexed: false,
            },
          ],
        },
        fromBlock: BigInt(fromBlock), // speaker demo (jelaskan ini anti-pattern)
        toBlock: BigInt(toBlock),
      });

      const mappedEvents = events.map((event) => ({
        blockNumber: event.blockNumber?.toString(),
        value: event.args.newValue?.toString(),
        txHash: event.transactionHash,
      }));

      // 🔹 Pagination sederhana
      const total = mappedEvents.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedEvents = mappedEvents.slice(startIndex, endIndex);

      return {
        identitas: {
          nama: 'Mochammad Rafi Adzaky',
          nim: '221011402867',
        },
        data: paginatedEvents,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  // 🔹 Centralized RPC Error Handler
  private handleRpcError(error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);

    console.log({ error: message });

    if (message.includes('timeout')) {
      throw new ServiceUnavailableException(
        'RPC timeout. Silakan coba beberapa saat lagi.',
      );
    }

    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed')
    ) {
      throw new ServiceUnavailableException(
        'Tidak dapat terhubung ke blockchain RPC.',
      );
    }

    throw new InternalServerErrorException(
      'Terjadi kesalahan saat membaca data blockchain.',
    );
  }
}
