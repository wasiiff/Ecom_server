import { IsString, IsNumber, Min, Max } from "class-validator";

export class CreateProductReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comment: string;

  @IsString()
  product: string; // product ID
}
