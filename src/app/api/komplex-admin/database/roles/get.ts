import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

interface TablePrivileges {
  name: string;
  privileges: string[];
}

interface RolesData {
  role: string;
  tables: TablePrivileges[];
}

export const GetRolesResponseSchema = z.object({
  roles: z.array(z.object({
    role: z.string(),
    tables: z.array(z.object({
      name: z.string(),
      privileges: z.array(z.string()),
    })),
  })),
}).openapi("GetRolesResponse");

export const GetRoles = async (req: Request, res: Response) => {
  try {
    const data: RolesData[] = [];

    const rolesResult = await db.execute(
      sql`SELECT rolname, rolpassword FROM pg_authid WHERE rolname NOT LIKE 'pg_%' AND rolpassword IS NULL`
    );

    const privilegesResult = await db.execute(
      sql`SELECT grantee, table_name, privilege_type 
       FROM information_schema.role_table_grants 
       WHERE table_schema != 'information_schema'
       AND table_schema != 'pg_catalog'
       AND grantee != 'postgres'
       ORDER BY grantee, table_schema, table_name`
    );

    const roleMap = new Map<string, RolesData>();

    rolesResult.rows.forEach((role: any) => {
      roleMap.set(role.rolname, {
        role: role.rolname,
        tables: [],
      });
    });

    privilegesResult.rows.forEach((privilege: any) => {
      const roleData = roleMap.get(privilege.grantee);
      if (roleData) {
        let tableEntry = roleData.tables.find(
          (t) => t.name === privilege.table_name
        );
        if (!tableEntry) {
          tableEntry = {
            name: privilege.table_name,
            privileges: [],
          };
          roleData.tables.push(tableEntry);
        }
        if (!tableEntry.privileges.includes(privilege.privilege_type)) {
          tableEntry.privileges.push(privilege.privilege_type);
        }
      }
    });

    data.push(...Array.from(roleMap.values()));

    return res.status(200).json(GetRolesResponseSchema.parse(data));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

