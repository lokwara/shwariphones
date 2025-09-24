# Migration Plan: MongoDB → SQLite/PostgreSQL

## Current MongoDB Schema Analysis
Based on your typeDefs.js, you have these main entities:
- Users (customers, admins)
- Devices (products with variants)
- Orders (sales, payments)
- Repairs (service tracking)
- BuyBacks (trade-ins)
- Offers (promotions)
- Reviews
- Blogs

## Migration Options

### Option 1: SQLite + Prisma (FREE)
```bash
# Install Prisma
npm install prisma @prisma/client
npm install -D prisma

# Initialize Prisma
npx prisma init --datasource-provider sqlite
```

**Schema Example:**
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  phoneNumber String?
  isAdmin   Boolean  @default(false)
  adminRights String[]
  cart      CartItem[]
  orders    Order[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Device {
  id        String   @id @default(cuid())
  serialNo  String   @unique
  imei      String   @unique
  variantId String
  variant   Variant  @relation(fields: [variantId], references: [id])
  storageId String
  storage   Storage  @relation(fields: [storageId], references: [id])
  colorId   String
  color     Color    @relation(fields: [colorId], references: [id])
  status    String   @default("Available")
  buyBackPrice Int?
  grade     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Option 2: PostgreSQL + Prisma (FREE tier)
```bash
# Use Supabase free tier
npx prisma init --datasource-provider postgresql
```

## Migration Steps

1. **Install Prisma**
2. **Create new schema** based on your GraphQL types
3. **Migrate data** from MongoDB to new database
4. **Update resolvers** to use Prisma instead of Mongoose
5. **Test thoroughly**
6. **Deploy**

## Cost Comparison

| Database | Monthly Cost | Best For |
|----------|-------------|----------|
| MongoDB Atlas | $9-57/month | Large scale |
| SQLite | $0/month | Small-medium |
| PostgreSQL (Supabase) | $0-25/month | Medium |
| PlanetScale | $0-29/month | Growing |

## Recommendation
For cost optimization: **SQLite + Prisma** for development, **PostgreSQL (Supabase free tier)** for production.


