import { IsString, IsNumber, Min, Max, IsOptional } from "class-validator";

export class UpdateProductReviewDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
