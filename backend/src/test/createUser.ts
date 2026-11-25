import { prisma } from "../db/prisma";

async function createUser() {
  const user = await prisma.user.create({
    data: {
      googleId: "test-google-id-123",
      name: "Test User",
      email: "testuser@gmail.com",
      avatar: null,
    },
  });

  console.log(" Test user created:", user.id);
}

createUser();
