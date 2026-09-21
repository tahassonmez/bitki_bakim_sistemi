import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
