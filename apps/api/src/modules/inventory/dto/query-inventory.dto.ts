import { IsOptional, IsString } from 'class-validator';

export class QueryInventoryDto {
  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  commodityId?: string;

  @IsOptional()
  @IsString()
  status?: 'surplus' | 'shortage' | 'balanced';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  limit?: number;

  @IsOptional()
  page?: number;
}
