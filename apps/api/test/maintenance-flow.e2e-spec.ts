import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';

describe('Maintenance flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  it('runs customer, location, plant, maintenance, and scheduling flow', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@wask.co', password: 'demo1234' })
      .expect(201);
    const token = login.body.data.accessToken as string;
    const staffId = login.body.data.staff.id as string;

    const customer = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `E2E Test Customer ${Date.now()}` })
      .expect(201);
    const customerId = customer.body.data.id as string;

    const location = await request(app.getHttpServer())
      .post('/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Location', customerId })
      .expect(201);
    const locationId = location.body.data.id as string;

    const plant = await request(app.getHttpServer())
      .post('/plants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'E2E Plant',
        species: 'Test species',
        locationId,
        careFrequencyDays: 15,
      })
      .expect(201);
    const plantId = plant.body.data.id as string;

    const types = await request(app.getHttpServer())
      .get('/maintenance-types')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const typeId = types.body.data[0].id as string;
    const date = new Date();

    await request(app.getHttpServer())
      .post(`/plants/${plantId}/maintenance-logs`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: date.toISOString(),
        staffId,
        typeIds: [typeId],
        notes: 'E2E maintenance',
      })
      .expect(201);

    const plantAfter = await request(app.getHttpServer())
      .get(`/plants/${plantId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(plantAfter.body.data.nextMaintenanceDate).toBeDefined();
    expect(new Date(plantAfter.body.data.nextMaintenanceDate).getTime()).toBe(
      new Date(date).setDate(new Date(date).getDate() + 15),
    );
  });

  afterAll(async () => {
    await app.close();
  });
});
