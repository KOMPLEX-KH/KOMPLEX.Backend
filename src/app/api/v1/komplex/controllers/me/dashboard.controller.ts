import { Request, Response } from "express";
import * as dashboardService from "@/app/api/v2/komplex/services/me/dashboard/service.js";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";

