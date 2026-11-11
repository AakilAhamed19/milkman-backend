import { AppDataSource } from "./src/datasource";
import { User } from "./src/model";

async function main() {
  await AppDataSource.initialize();
  const users = await AppDataSource.getRepository(User).find({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
    },
  });
  console.log("USERS_LIST:", JSON.stringify(users, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
