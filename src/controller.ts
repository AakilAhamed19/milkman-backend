import type { Request, Response } from "express";
import { getAllUsersUseCase, getUserByIdUseCase, getUserByMobileUseCase, getUserByNameUseCase, registerUserUsecase ,getUserByEmailUseCase, updateUserUseCase, deleteUserUseCase} from "./usecase";

export async function registeruser(req: Request, res: Response) {
    try {
        const { name, email, phoneNumber, password } = req.body;

        if (!name || !email || !phoneNumber || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const user = await registerUserUsecase(req.body);

        return res.status(201).json({
            message: "User registered successfully",
            user
        });
    } catch (error: any) {
        return res.status(400).json({
            message: error.message
        });
    }
}

export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await getAllUsersUseCase();

    return res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const user = await getUserByIdUseCase(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
}
export async function getUserByName(req: Request, res: Response) {
  try {
    const { name } = req.params;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        message: "User name is required",
      });
    }

    const users = await getUserByNameUseCase(name);

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function getUserByMobile(req: Request, res: Response) {
  try {
    const { phoneNumber } = req.params;

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    const user = await getUserByMobileUseCase(phoneNumber);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function getUserByEmail(req: Request, res: Response) {
  try {
    const { email } = req.params;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await getUserByEmailUseCase(email);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const user = await updateUserUseCase(
      id,
      req.body
    );
    return res.status(200).json({
      message:"User update successfully",
      user,
    });
  }catch (error:any){
    if (error.message === "User not found") {
      return res.status(404).json({
        message: error.message,
      });

    }
    if (error.message==="Email already exists"){
      return res.status(409).json({
        message: error.message,
      });
    }
    return res.status(500).json({
     message:error.message,  
    });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const result = await deleteUserUseCase(id);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "User not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}