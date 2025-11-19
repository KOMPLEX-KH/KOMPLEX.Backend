import "dotenv/config";

import { seedSearchTask } from "./seedFunction.js";

const run = async () => {
  console.log("Seeding Meilisearch data...");
  const { videosIndexed } = await seedSearchTask();
  console.log(`Seeding complete. Videos indexed: ${videosIndexed}`);
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed Meilisearch:", error);
    process.exit(1);
  });
