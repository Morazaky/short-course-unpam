import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { GetEventsDto } from './dto/get-events.dto';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  // GET /blockchain/value
  @Get('value')
  async getValue() {
    return this.blockchainService.getLatestValue();
  }

  // GET /blockchain/events with optional query params
  @Get('events')
  async getEvents(@Query() query: Partial<GetEventsDto>) {
    // Get current block first
    const currentBlock = await this.blockchainService.getCurrentBlock();

    // Default: get last 100 blocks
    const defaultFromBlock = Math.max(0, currentBlock - 100);
    const fromBlock = query.fromBlock || defaultFromBlock;
    const toBlock = query.toBlock || currentBlock;
    const page = query.page || 1;
    const limit = query.limit || 10;

    return this.blockchainService.getValueUpdatedEvents(
      fromBlock,
      toBlock,
      page,
      limit,
    );
  }

  // Keep POST version for backward compatibility
  @Post('events')
  async getEventsPost(@Body() body: GetEventsDto) {
    return this.blockchainService.getValueUpdatedEvents(
      body.fromBlock,
      body.toBlock,
      body.page,
      body.limit,
    );
  }
}
