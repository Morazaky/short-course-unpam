import { ApiProperty } from '@nestjs/swagger';

export class GetEventsDto {
  @ApiProperty({
    description: 'The starting block number to fetch events from',
    example: 1234567,
  })
  fromBlock: number;

  @ApiProperty({
    description: 'The ending block number to fetch events to',
    example: 1234599,
  })
  toBlock: number;

  @ApiProperty({
    description: 'Page number for pagination (Task 4 - Opsional)',
    example: 1,
    default: 1,
    required: false,
  })
  page?: number;

  @ApiProperty({
    description: 'Number of items per page (Task 4 - Opsional)',
    example: 10,
    default: 10,
    required: false,
  })
  limit?: number;
}
