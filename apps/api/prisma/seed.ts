import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ProductType, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const maintenanceTypeNames = [
  'Sulama',
  'Gubreleme',
  'Budama',
  'Ilaclama',
  'Yaprak Temizligi',
  'Toprak Degisimi',
  'Saksi Degisimi',
];

async function findOrCreateCustomer(name: string, data: Parameters<typeof prisma.customer.create>[0]['data']) {
  const existing = await prisma.customer.findFirst({ where: { name } });
  return existing ?? prisma.customer.create({ data });
}

async function findOrCreateLocation(customerId: string, name: string) {
  const existing = await prisma.location.findFirst({ where: { customerId, name } });
  return existing ?? prisma.location.create({ data: { customerId, name } });
}

async function findOrCreateProduct(name: string, type: ProductType, unit: string, stockQuantity: number) {
  const existing = await prisma.product.findFirst({ where: { name, type } });
  return (
    existing ??
    prisma.product.create({
      data: { name, type, unit, stockQuantity },
    })
  );
}

async function main() {
  const passwordHash = await bcrypt.hash('demo1234', 10);

  const admin = await prisma.staff.upsert({
    where: { email: 'admin@wask.co' },
    update: { fullName: 'Admin Kullanici', passwordHash, role: Role.ADMIN, isActive: true },
    create: {
      fullName: 'Admin Kullanici',
      email: 'admin@wask.co',
      passwordHash,
      role: Role.ADMIN,
    },
  });
  const staff1 = await prisma.staff.upsert({
    where: { email: 'ahmet@wask.co' },
    update: { fullName: 'Ahmet Bakimci', passwordHash, role: Role.STAFF, isActive: true },
    create: {
      fullName: 'Ahmet Bakimci',
      email: 'ahmet@wask.co',
      passwordHash,
      role: Role.STAFF,
    },
  });
  const staff2 = await prisma.staff.upsert({
    where: { email: 'zeynep@wask.co' },
    update: { fullName: 'Zeynep Saha', passwordHash, role: Role.STAFF, isActive: true },
    create: {
      fullName: 'Zeynep Saha',
      email: 'zeynep@wask.co',
      passwordHash,
      role: Role.STAFF,
    },
  });

  const types = await Promise.all(
    maintenanceTypeNames.map((name) =>
      prisma.maintenanceType.upsert({
        where: { name },
        update: { isActive: true },
        create: { name },
      }),
    ),
  );
  const typeByName = new Map(types.map((type) => [type.name, type]));

  const fertilizer = await findOrCreateProduct('Yesil Yaprak Gubresi', ProductType.FERTILIZER, 'litre', 20);
  const pesticide = await findOrCreateProduct('Bitki Koruyucu Ilac', ProductType.PESTICIDE, 'litre', 10);
  const soil = await findOrCreateProduct('Salon Bitkisi Topragi', ProductType.OTHER, 'kg', 100);

  const customer1 = await findOrCreateCustomer('Ornek AVM', {
    name: 'Ornek AVM',
    address: 'Istanbul',
    phone: '02120000000',
    email: 'avm@example.com',
  });
  const customer2 = await findOrCreateCustomer('Kuzey Plaza', {
    name: 'Kuzey Plaza',
    address: 'Ankara',
    phone: '03120000000',
    email: 'plaza@example.com',
  });

  const lobby = await findOrCreateLocation(customer1.id, 'Zemin Kat Lobi');
  await findOrCreateLocation(customer1.id, 'Otopark Girisi');
  await findOrCreateLocation(customer2.id, 'Ana Giris');
  await findOrCreateLocation(customer2.id, 'Teras');

  const plants = [];
  for (let index = 1; index <= 50; index += 1) {
    const plantCode = `WSK-${String(index).padStart(6, '0')}`;
    const plant = await prisma.plant.upsert({
      where: { plantCode },
      update: {
        name: 'Areka Palmiyesi',
        species: 'Dypsis lutescens',
        locationId: lobby.id,
        careFrequencyDays: 15,
        status: 'ACTIVE',
      },
      create: {
        plantCode,
        name: 'Areka Palmiyesi',
        species: 'Dypsis lutescens',
        locationId: lobby.id,
        careFrequencyDays: 15,
        registeredAt: new Date('2026-09-01T09:00:00Z'),
      },
    });
    plants.push(plant);
  }

  const logs = [
    {
      plant: plants[0],
      staff: staff1,
      date: new Date('2026-09-10T09:00:00Z'),
      notes: 'Rutin sulama ve yaprak kontrolu',
      typeNames: ['Sulama', 'Yaprak Temizligi'],
      products: [{ productId: fertilizer.id, quantityUsed: 0.2 }],
    },
    {
      plant: plants[1],
      staff: staff2,
      date: new Date('2026-09-11T10:30:00Z'),
      notes: 'Budama sonrasi koruyucu uygulama',
      typeNames: ['Budama', 'Ilaclama'],
      products: [{ productId: pesticide.id, quantityUsed: 0.1 }],
    },
    {
      plant: plants[2],
      staff: staff1,
      date: new Date('2026-09-12T14:00:00Z'),
      notes: 'Toprak kontrolu ve destek gubreleme',
      typeNames: ['Gubreleme'],
      products: [
        { productId: fertilizer.id, quantityUsed: 0.15 },
        { productId: soil.id, quantityUsed: 2 },
      ],
    },
  ];

  for (const item of logs) {
    const existingLog = await prisma.maintenanceLog.findFirst({
      where: { plantId: item.plant.id, staffId: item.staff.id, date: item.date },
    });
    const log =
      existingLog ??
      (await prisma.maintenanceLog.create({
        data: {
          plantId: item.plant.id,
          staffId: item.staff.id,
          date: item.date,
          notes: item.notes,
        },
      }));

    for (const typeName of item.typeNames) {
      const type = typeByName.get(typeName);
      if (!type) throw new Error(`Missing maintenance type: ${typeName}`);
      await prisma.maintenanceLogAction.upsert({
        where: { logId_typeId: { logId: log.id, typeId: type.id } },
        update: {},
        create: { logId: log.id, typeId: type.id },
      });
    }

    for (const product of item.products) {
      await prisma.maintenanceLogProduct.upsert({
        where: { logId_productId: { logId: log.id, productId: product.productId } },
        update: { quantityUsed: product.quantityUsed },
        create: { logId: log.id, productId: product.productId, quantityUsed: product.quantityUsed },
      });
    }

    await prisma.plant.update({
      where: { id: item.plant.id },
      data: {
        lastMaintenanceDate: item.date,
        nextMaintenanceDate: new Date(item.date.getTime() + item.plant.careFrequencyDays * 24 * 60 * 60 * 1000),
      },
    });
  }

  await prisma.photo.upsert({
    where: { id: 'day4-demo-photo' },
    update: { url: 'https://example.com/demo-plant.jpg', uploadedById: admin.id },
    create: {
      id: 'day4-demo-photo',
      logId: (await prisma.maintenanceLog.findFirstOrThrow({ where: { plantId: plants[0].id } })).id,
      url: 'https://example.com/demo-plant.jpg',
      uploadedById: admin.id,
    },
  });

  console.log({
    admin: admin.email,
    staff: [staff1.email, staff2.email],
    customerCount: 2,
    locationCount: 4,
    plantCount: plants.length,
    maintenanceTypeCount: types.length,
    maintenanceLogCount: logs.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
