import { IsBoolean, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Transform } from "class-transformer";
import { PaginationDto } from "../../shared/dto/pagination.dto";


export class ProductQueryDto extends PaginationDto {
    @IsOptional()
    @IsString()
    name?: string

    @IsOptional()
    @IsString()
    category?: string

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) =>{
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    isInStock?: boolean

    @IsOptional()
    @Min(0)
    @IsNumber()
    @Transform(({value}) => Number(value))
    priceFrom?: number

    @IsOptional()
    @Min(0)
    @IsNumber()
    @Transform(({value}) => Number(value))
    priceTo?: number

    @IsOptional()
    @IsString()
    sort?: string
}