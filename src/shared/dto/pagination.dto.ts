import { Transform } from "class-transformer"
import { IsInt, IsOptional, Max, Min } from "class-validator"


export class PaginationDto {

    @IsOptional()
    @Transform(({value}) => value !== undefined ? Number(value) : value)
    @IsInt()
    @Min(1)
    page?: number = 1

    @IsOptional()
    @Transform(({value}) => value !== undefined ? Number(value) : value)
    @IsInt()
    @Min(1)
    @Max(30)
    take?: number = 10
}