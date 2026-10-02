import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './schemas/product.schema';
import { Model} from 'mongoose';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>
  ){}

  async create(createProductDto: CreateProductDto) {
    const newProduct = await this.productModel.create(createProductDto)
    return newProduct
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

  async update(id: string, updateProductDto: UpdateProductDto) {
    const updatedProduct = await this.productModel.findByIdAndUpdate(id, {...updateProductDto, $inc: {__v: 1}}, {new: true})
    if(!updatedProduct) throw new NotFoundException("Product not found")
    
    return updatedProduct
  }

  async remove(id: string) {
    const deletedProduct = await this.productModel.findByIdAndDelete(id)
    if(!deletedProduct) throw new NotFoundException("Product not found")
    
    return deletedProduct
  }
}
