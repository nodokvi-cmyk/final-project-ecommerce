import { IsNotEmpty, IsString } from 'class-validator';

// Items, names and prices are never taken from the client. The order is built
// from the caller's server-side cart and the current product data.
export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  shippingAddress!: string;
}
