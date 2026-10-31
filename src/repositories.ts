import {AppDataSource} from "../src/datasource";
import {User} from "../src//model";

const userRepository = AppDataSource.getRepository(User);

export async function createuserRepository(data: Partial<User>) {
    const user = userRepository.create(data);
    return userRepository.save(user);

}

export async function findUserByEmailRepository(email:string){
    return userRepository.findOne({
        where:{email},
        select: {
            id:true,
            name:true,
            email:true,
            phoneNumber:true,
            role:true, 
        },
    });
}

export async function findUserByIdRepository(id:string) {
    return userRepository.findOne({
        where:{ id },
        select:{
            id:true,
            name:true,
            email: true,
            phoneNumber:true, 
            role:true,
        },
    });
}

export async function findUserByNameRepository(name:string){
    return userRepository.find ({
        where:{name},
        select:{
            id:true,
            name:true,
            email:true,
            phoneNumber:true,
            role:true,
        },
    });
}

export async function findUserByMobileRepository(phoneNumber:string){
    return userRepository.findOne({
        where:{phoneNumber},
        select:{
            id:true,
            name:true,
            email:true,
            phoneNumber:true,
            role:true,
        },
    });
}

export async function getAllUserRepository(){
    return userRepository.find({
        select:{
            id:true,
            name:true,
            email:true,
            phoneNumber:true,
            role:true,

        },
    });
}

export async function updateUserRepository(
    id:string,
    data:Partial<User>
){
    await userRepository.update({id},data);
    return findUserByIdRepository(id);
}

export async function deleteuserRepository(id:string){
    return userRepository.delete({id});
}

