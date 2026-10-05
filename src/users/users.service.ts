import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../shared/dto/pagination.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema.js';
import { HydratedDocument, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AwsS3Service } from '../aws-s3/aws-s3.service';
import * as path from 'path';
import { randomUUID } from 'crypto';
import * as mime from 'mime-types';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private awsS3Service: AwsS3Service,
  ) {}

  async uploadAvatar(file: Express.Multer.File, userId: string) {
    if (!file) throw new BadRequestException('File is required');

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.avatarUrl) {
      const fileId = user.avatarUrl.replace(
        `${process.env.CLOUDFRONT_DOMAIN_NAME}/`,
        '',
      );
      await this.awsS3Service.deleteFile(fileId);
    }

    const ext = path.extname(file.originalname);
    const fileId = `avatars/${randomUUID()}${ext}`;
    const fixedMimeType = mime.lookup(file.originalname || file.mimetype);

    await this.awsS3Service.uploadFile(fileId, file.buffer, fixedMimeType);
    const cloudFrontUri = `${process.env.CLOUDFRONT_DOMAIN_NAME}/${fileId}`;

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      {
        avatarUrl: cloudFrontUri,
      },
      { new: true },
    );

    return updatedUser;
  }

  async deleteAvatar(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.avatarUrl) {
      throw new NotFoundException('User or avatar not found');
    }

    const fileId = user.avatarUrl.replace(
      `${process.env.CLOUDFRONT_DOMAIN_NAME}/`,
      '',
    );

    await this.awsS3Service.deleteFile(fileId);

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { avatarUrl: '' },
      { new: true },
    );

    return updatedUser;
  }

  async findAll({ page = 1, take = 10 }: PaginationDto) {
    const resp = await this.userModel
      .find()
      .skip((page - 1) * take)
      .limit(take);
    return resp;
  }

  async createAuthUser({
    fullName,
    email,
    age,
    password,
    avatarUrl,
    OTPCode,
    OTPCodeExpirationDate,
  }: Pick<
    User,
    | 'fullName'
    | 'email'
    | 'age'
    | 'avatarUrl'
    | 'password'
    | 'OTPCode'
    | 'OTPCodeExpirationDate'
  >): Promise<HydratedDocument<User>> {
    //

    return this.userModel.create({
      fullName,
      email,
      age,
      password,
      avatarUrl,
      OTPCode,
      OTPCodeExpirationDate,
    });
  }

  async markEmailVerified(
    email: string,
  ): Promise<HydratedDocument<User> | null> {
    return this.userModel.findOneAndUpdate(
      { email },
      {
        $set: { isVerified: true },
        $unset: { OTPCode: 1, OTPCodeExpirationDate: 1 },
      },
      { new: true },
    );
  }

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<HydratedDocument<User> | null> {
    const query = this.userModel.findOne({ email });

    return includePassword ? query.select('password') : query;
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailAlreadyUsed = await this.userModel.findOne({
        email: updateUserDto.email,
      });
      if (emailAlreadyUsed) throw new BadRequestException('Email already used');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      { new: true },
    );

    return updatedUser;
  }

  async remove(id: string) {
    const deletedUser = await this.userModel.findByIdAndDelete(id);
    if (!deletedUser) throw new NotFoundException('User not found');
    if (deletedUser.avatarUrl) {
      const fileId = deletedUser.avatarUrl.replace(
        `${process.env.CLOUDFRONT_DOMAIN_NAME}/`,
        '',
      );
      await this.awsS3Service.deleteFile(fileId);
    }

    return deletedUser;
  }

  async updateVerificationCode(
    email: string,
    OTPCode: string,
    OTPCodeExpirationDate: number,
  ): Promise<HydratedDocument<User> | null> {
    return this.userModel.findOneAndUpdate(
      { email },
      { $set: { OTPCode, OTPCodeExpirationDate } },
      { new: true },
    );
  }
}
