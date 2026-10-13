import { IsMongoId, IsNotEmpty } from 'class-validator';

// Only the order id comes from the client. Items, prices and currency are
// read from the stored order on the server.
export class CreatePaymentDto {
  @IsNotEmpty()
  @IsMongoId()
  orderId!: string;
}
