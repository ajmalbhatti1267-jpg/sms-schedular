import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('Ajmal5586240.', 12)
  const user = await prisma.user.upsert({
    where: { email: 'ajmalbhatti1267@gmail.com' },
    update: { passwordHash: hash },
    create: {
      email: 'ajmalbhatti1267@gmail.com',
      passwordHash: hash,
    },
  })
  console.log('User created:', user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
