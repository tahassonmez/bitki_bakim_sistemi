import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { HealthController } from './health/health.controller.js';
import { LocationsModule } from './locations/locations.module.js';
import { MaintenanceLogsModule } from './maintenance-logs/maintenance-logs.module.js';
import { MaintenanceTypesModule } from './maintenance-types/maintenance-types.module.js';
import { PhotosModule } from './photos/photos.module.js';
import { PlantsModule } from './plants/plants.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import { StaffModule } from './staff/staff.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    PrismaModule,
    AuthModule,
    StaffModule,
    DashboardModule,
    CustomersModule,
    LocationsModule,
    PlantsModule,
    MaintenanceTypesModule,
    ProductsModule,
    MaintenanceLogsModule,
    PhotosModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
