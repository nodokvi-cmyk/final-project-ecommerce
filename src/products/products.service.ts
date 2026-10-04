import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './schemas/product.schema';
import { Model} from 'mongoose';
import { ProductQueryDto } from './dto/product-query.dto';
import { AwsS3Service } from '../aws-s3/aws-s3.service';
import * as path from 'path';
import { randomUUID } from 'crypto';
import * as mime from "mime-types"

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    private awsS3Service: AwsS3Service
  ){}

  async create(createProductDto: CreateProductDto, files?: Array<Express.Multer.File>) {
    const uploadedPhotoUrls: string[] = []

    if(files && files.length > 0) {
      for (let file of files){
        const ext = path.extname(file.originalname)
        const fileId = `productPhotos/${randomUUID()}${ext}`
        const fixedMimeType = mime.lookup(file.originalname || file.mimetype)
        
        await this.awsS3Service.uploadFile(fileId, file.buffer, fixedMimeType)
        const cloudFrontUri = `${process.env.CLOUDFRONT_DOMAIN_NAME}/${fileId}`
        uploadedPhotoUrls.push(cloudFrontUri)
      }
    }

    const newProduct = await this.productModel.create({
      ...createProductDto,
      photos: uploadedPhotoUrls
    })

    return newProduct
  }

  async deleteSinglePhoto(productId: string, photoUrl: string) {
    const product = await this.productModel.findById(productId)
    if (!product) {
        throw new NotFoundException('Product not found')
    }

    const fullPhotoUrl = product.photos.find((url) => url === photoUrl || url.endsWith(photoUrl))

    if (!fullPhotoUrl){
        throw new NotFoundException('Photo not found in this product')
    }

    const productPhotosIndex = fullPhotoUrl.indexOf('productPhotos/');
    const fileId = productPhotosIndex !== -1 ? fullPhotoUrl.substring(productPhotosIndex) : fullPhotoUrl

    await this.awsS3Service.deleteFile(fileId)

    const updatedProduct = await this.productModel.findByIdAndUpdate(
      productId,
      { $pull: { photos: fullPhotoUrl } },
      { new: true },
    )

    return updatedProduct
  }

  async findAll(query: ProductQueryDto = {}) {
    const {page = 1,take = 10, name, category, isInStock, priceFrom, priceTo, sort} = query
    
    const filter: any = {}

    const sortQuery: Record<string, 1 | -1> = {}

    if (priceFrom !== undefined) {
    filter['price'] = { ...filter.price, $gte: priceFrom }
  }

  if (priceTo !== undefined) {
    filter['price'] = { ...filter.price, $lte: priceTo }
  }

  if (name) {
    filter['name'] = { $regex: name, $options: 'i' }
  }

  if (category) {
    filter['category'] = category
  }

  if (isInStock && isInStock === true) {
    filter['stock'] = { $ne: 0 }
  }

  if (isInStock === false) {
    filter['stock'] = 0
  }

  if (sort && sort === 'price') {
    sortQuery['price'] = 1
  }

  if (sort && sort === '-price') {
    sortQuery['price'] = -1
  }

  if (sort && sort === 'date') {
    sortQuery['_id'] = 1
  }

  if (sort && sort === '-date') {
    sortQuery['_id'] = -1
  }

  const resp = await this.productModel
    .find(filter)
    .sort(sortQuery)
    .skip((page - 1) * take)
    .limit(take)
    .exec()

  return resp
}

  async findOne(id: string) {
    const product = await this.productModel.findById(id)
    if(!product) throw new NotFoundException("Product not found")

    return product
  }

  async update(id: string, updateProductDto: UpdateProductDto, files?: Array<Express.Multer.File>) {
    const product = await this.productModel.findById(id)
    if(!product) throw new NotFoundException("Product not found")
    
    const existingPhotosCount = product.photos?.length || 0
    const newFilesCount = files?.length || 0

    if(existingPhotosCount + newFilesCount > 6){
      throw new BadRequestException("A single product can't have more than 6 photos")
    }

    const uploadedPhotoUrls: string[] = []

    if(files && files.length > 0){
      for (let file of files){
        const ext = path.extname(file.originalname)
        const fileId = `productPhotos/${randomUUID()}${ext}`
        const fixedMimeType = mime.lookup(file.originalname || file.mimetype)
        
        await this.awsS3Service.uploadFile(fileId, file.buffer, fixedMimeType)
        const cloudFrontUri = `${process.env.CLOUDFRONT_DOMAIN_NAME}/${fileId}`
        uploadedPhotoUrls.push(cloudFrontUri)
      }
    }

    const updatedProduct = await this.productModel.findByIdAndUpdate(id, {
      ...updateProductDto,
      $inc: {__v: 1},
      ...(uploadedPhotoUrls.length > 0 && {
        $push: { photos: {$each: uploadedPhotoUrls } },
      }),
    }, {new: true})

    return updatedProduct
  }

  async remove(id: string) {
    const deletedProduct = await this.productModel.findByIdAndDelete(id)
    if(!deletedProduct) throw new NotFoundException("Product not found")

    if (deletedProduct.photos && deletedProduct.photos.length > 0) {
      for (const photoUrl of deletedProduct.photos) {
        const productPhotosIndex = photoUrl.indexOf('productPhotos/')
        const fileId = productPhotosIndex !== -1 ? photoUrl.substring(productPhotosIndex) : photoUrl

        await this.awsS3Service.deleteFile(fileId)
      }
    }
    
    return deletedProduct
  }
}
