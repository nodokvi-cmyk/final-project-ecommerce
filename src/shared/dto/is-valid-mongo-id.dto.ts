import { IsMongoId } from "class-validator";


export class IsValidMongoIdDto {
    @IsMongoId({message: "Use MongoDB ID"})
    id!: string
}