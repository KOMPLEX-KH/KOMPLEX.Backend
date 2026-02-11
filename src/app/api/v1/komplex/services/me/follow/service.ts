import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { followers } from "@/db/schema.js";
import { eq } from "drizzle-orm";
import { ResponseError } from "@/utils/responseError.js";




