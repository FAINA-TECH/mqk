import { ApiProperty } from '@nestjs/swagger';

export class AssignWorkerDto {
  @ApiProperty({
    description:
      'National ID of the worker to assign, or null to remove assignment',
    example: '123456789',
    required: true,
    nullable: true,
  })
  workerNationalId: string | null;
}
