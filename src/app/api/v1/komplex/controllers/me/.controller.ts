import { db } from "../../../../../../db/index.js";
import {
  followers,
  users,
} from "../../../../../../db/schema.js";
import { count, eq } from "drizzle-orm";
import { redis } from "../../../../../../db/redis/redisConfig.js";
import { AuthenticatedRequest } from "../../../../../../types/request.js";
import { Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";



