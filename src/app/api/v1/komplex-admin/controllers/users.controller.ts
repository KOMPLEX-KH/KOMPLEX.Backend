import { Request, Response } from "express";
import * as usersService from "../services/users/service.js";
import * as userByIdService from "../services/users/[id]/service.js";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page } = req.query;
    const pageNumber = Number(page) || 1;

    const allUsers = await usersService.getAllUsers(pageNumber);

    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const { page } = req.query;
    const pageNumber = Number(page) || 1;

    const allAdmins = await usersService.getAllAdmins(pageNumber);

    res.json(allAdmins);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admins" + error });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, uid } = req.body;

    const result = await userByIdService.createAdmin(
      firstName,
      lastName,
      email,
      phone,
      uid
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create admin" });
  }
};

export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email } = req.body;

    const result = await userByIdService.updateAdmin(
      Number(id),
      firstName,
      lastName,
      email
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to update admin" });
  }
};

export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await userByIdService.deleteAdmin(Number(id));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete admin" });
  }
};
