import { prisma } from "../server/utils/db";
import bcrypt from 'bcryptjs';

export default async function seed() {
    console.log('Seeding database...');
    const userData = {
        name: 'Abdurrahman Ramadhan',
        email: "abdmandhan@gmail.com",
        password: await bcrypt.hash("12341234", 10),
    }
    let user = await prisma.user.findFirst({
        where: {
            email: userData.email,
        },
    });

    if (!user) {
        user = await prisma.user.create({
            data: userData,
        });
    }

    console.log('Database seeded successfully');
}


seed().catch(console.error);