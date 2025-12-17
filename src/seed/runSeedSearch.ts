import "dotenv/config";

import { seedSearchTask } from "./seedFunction.js";

const run = async () => {
  console.log("Seeding Meilisearch data...");
  await seedSearchTask();
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed Meilisearch:", error);
    process.exit(1);
  });
