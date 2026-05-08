import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateInventoryDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyDemand?: number;
}
