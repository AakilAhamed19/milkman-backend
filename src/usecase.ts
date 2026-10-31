import 
{createuserRepository,
findUserByEmailRepository, 
findUserByIdRepository, 
findUserByNameRepository, 
findUserByMobileRepository, 
getAllUserRepository, 
updateUserRepository, 
deleteuserRepository} from "../src/repositories"

import bcrypt from "bcrypt";

export interface RegisterUserInput {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
}   

export async function registerUserUsecase(data: RegisterUserInput) {
    const email = data.email.trim().toLowerCase();

    const existingUser = await findUserByEmailRepository(email)

    if (existingUser){
        throw new Error("The User with this Email, Already Exists")
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return createuserRepository({
    name: data.name.trim(),
    email,
    phoneNumber: data.phoneNumber.trim(),
    password: hashedPassword,
    role: "employee"
    })

} 

export async function getAllUsersUseCase() {
  return getAllUserRepository();
}

export async function getUserByIdUseCase(id: string) {
  return findUserByIdRepository(id);
}

export async function getUserByNameUseCase(name: string) {
  return findUserByNameRepository(name);
}

export async function getUserByMobileUseCase(phoneNumber: string) {
  return findUserByMobileRepository(phoneNumber);
}
export async function getUserByEmailUseCase(email: string) {
  return findUserByEmailRepository(email.trim().toLowerCase());
}


export async function updateUserUseCase(id: string, data: any) {
  const user = await findUserByIdRepository(id);

  if (!user) {
    throw new Error("User not found");
  }

  if (data.email && data.email !== user.email) {
    const existingUser = await findUserByEmailRepository(
      data.email.trim().toLowerCase()
    );

    if (existingUser) {
      throw new Error("Email already exists");
    }
  }

  return updateUserRepository(id, {
    name: data.name,
    email: data.email?.trim().toLowerCase(),
    phoneNumber: data.phoneNumber,
  });
}

export async function deleteUserUseCase(id: string) {
  const user = await findUserByIdRepository(id);

  if (!user) {
    throw new Error("User not found");
  }

  await deleteuserRepository(id);

  return { message: "User deleted successfully" };
}