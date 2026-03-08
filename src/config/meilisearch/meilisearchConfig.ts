import { MeiliSearch } from "meilisearch";

export const meilisearch = new MeiliSearch({
  host: process.env.MEILI_HOST_URL!,
  apiKey: process.env.MEILI_MASTER_KEY!,
});