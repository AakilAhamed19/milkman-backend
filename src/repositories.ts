import {AppDataSource} from "./datasource";
import {User, otp, otpPurpose, CustomerEntity, DeliveryEntity, PaymentEntity, PriceEntity, AttendanceEntity} from "./model";

const userRepository = AppDataSource.getRepository(User);
const otpRepository = AppDataSource.getRepository(otp);
const customerRepository = AppDataSource.getRepository(CustomerEntity);
const deliveryRepository = AppDataSource.getRepository(DeliveryEntity);
const paymentRepository = AppDataSource.getRepository(PaymentEntity);
const priceRepository = AppDataSource.getRepository(PriceEntity);
const attendanceRepository = AppDataSource.getRepository(AttendanceEntity);

export async function createuserRepository(data: Partial<User>) {
    const user = userRepository.create(data);
    return userRepository.save(user);

}

export async function findUserByEmailRepository(email:string){
    return userRepository.findOne({
        where:{email},
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
             isVerified: true,
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
            isVerified: true,
        },
    });
}

export async function countAdminUsersRepository(): Promise<number> {
    return userRepository.count({
        where: { role: "admin", isVerified: true },
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




// OTP OPERATIONS

export async function createOtpRepository(data: Partial<otp>) {
  const otpRecord = otpRepository.create(data);
  return otpRepository.save(otpRecord);
}

export async function findLatestOtpRepository(
  email: string,
  purpose: otpPurpose
) {
  return otpRepository.findOne({
    where: {
      email,
      purpose,
      isUsed: false,
    },
    order: {
      createdAt: "DESC",
    },
  });
}

export async function updateOtpRepository(
  id: string,
  data: Partial<otp>
) {
  return otpRepository.update({ id }, data);
}

export async function invalidateOtpsRepository(
  email: string,
  purpose: otpPurpose
) {
  return otpRepository.update(
    {
      email,
      purpose,
      isUsed: false,
    },
    {
      isUsed: true,
    }
  );
}

// ================= CUSTOMER REPOSITORIES =================
export async function createCustomerRepository(data: Partial<CustomerEntity>) {
  const customer = customerRepository.create(data);
  return customerRepository.save(customer);
}

export async function getAllCustomersRepository() {
  return customerRepository.find({
    order: { createdAt: "DESC" },
  });
}

export async function findCustomerByIdRepository(id: string) {
  return customerRepository.findOne({
    where: { id },
  });
}

export async function updateCustomerRepository(id: string, data: Partial<CustomerEntity>) {
  await customerRepository.update(id, data);
  return customerRepository.findOne({ where: { id } });
}

export async function deleteCustomerRepository(id: string) {
  return customerRepository.delete(id);
}

// ================= DELIVERY REPOSITORIES =================
export async function createDeliveryRepository(data: Partial<DeliveryEntity>) {
  const delivery = deliveryRepository.create(data);
  return deliveryRepository.save(delivery);
}

export async function getDeliveriesByDateRepository(date: string) {
  return deliveryRepository.find({
    where: { date },
  });
}

export async function getAllDeliveriesRepository() {
  return deliveryRepository.find({
    order: { date: "DESC" },
  });
}

// ================= PAYMENT REPOSITORIES =================
export async function createPaymentRepository(data: Partial<PaymentEntity>) {
  const payment = paymentRepository.create(data);
  return paymentRepository.save(payment);
}

export async function getAllPaymentsRepository() {
  return paymentRepository.find({
    order: { date: "DESC" },
  });
}

// ================= PRICE REPOSITORIES =================
export async function createPriceRepository(data: Partial<PriceEntity>) {
  const price = priceRepository.create(data);
  return priceRepository.save(price);
}

export async function getAllPricesRepository() {
  return priceRepository.find({
    order: { effectiveFrom: "DESC" },
  });
}

// ================= ATTENDANCE REPOSITORIES =================
export async function recordAttendanceRepository(data: Partial<AttendanceEntity>) {
  if (!data.employeeId || !data.date) {
    throw new Error("Employee ID and Date are required");
  }
  const existing = await attendanceRepository.findOne({
    where: { employeeId: data.employeeId, date: data.date },
  });
  if (existing) {
    await attendanceRepository.update(existing.id, data);
    return attendanceRepository.findOne({ where: { id: existing.id } });
  }
  const att = attendanceRepository.create(data);
  return attendanceRepository.save(att);
}

export async function getAttendanceByDateRepository(date: string) {
  return attendanceRepository.find({
    where: { date },
  });
}