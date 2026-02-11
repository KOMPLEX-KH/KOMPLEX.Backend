import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { followers } from "@/db/schema.js";
import { ResponseError } from "@/utils/responseError.js";
import { eq, and } from "drizzle-orm";

