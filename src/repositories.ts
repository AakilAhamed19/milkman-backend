import { AppDataSource } from "./datasource";
import {
    Farm,
    User,
    otp,
    otpPurpose,
    CustomerEntity,
    DeliveryEntity,
    PaymentEntity,
    PriceEntity,
    AttendanceEntity
} from "./model";

const farmRepository = AppDataSource.getRepository(Farm);
const userRepository = AppDataSource.getRepository(User);
const otpRepository = AppDataSource.getRepository(otp);
const customerRepository = AppDataSource.getRepository(CustomerEntity);
const deliveryRepository = AppDataSource.getRepository(DeliveryEntity);
const paymentRepository = AppDataSource.getRepository(PaymentEntity);
const priceRepository = AppDataSource.getRepository(PriceEntity);
const attendanceRepository = AppDataSource.getRepository(AttendanceEntity);

// ================= FARM (ORGANIZATION) OPERATIONS =================
export async function createFarmRepository(data: { name: string; ownerEmail?: string; phoneNumber?: string; address?: string }) {
    const farm = farmRepository.create(data);
    return farmRepository.save(farm);
}

export async function findFarmByIdRepository(id: string) {
    return farmRepository.findOne({ where: { id } });
}

export async function getAllFarmsRepository() {
    return farmRepository.find({
        order: { createdAt: "DESC" },
    });
}

export async function updateFarmRepository(id: string, data: Partial<Farm>) {
    await farmRepository.update({ id }, data);
    return findFarmByIdRepository(id);
}

// ================= USER OPERATIONS =================
export async function createuserRepository(data: Partial<User>) {
    const user = userRepository.create(data);
    return userRepository.save(user);
}

export async function findUserByEmailRepository(email: string) {
    return userRepository.findOne({
        where: { email },
    });
}

export async function findUserByIdRepository(id: string) {
    return userRepository.findOne({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
            isVerified: true,
            farmId: true,
            farmName: true,
        },
    });
}

export async function findUserByNameRepository(name: string, farmId?: string) {
    const where: any = { name };
    if (farmId) where.farmId = farmId;
    return userRepository.find({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
            farmId: true,
            farmName: true,
        },
    });
}

export async function findUserByMobileRepository(phoneNumber: string, farmId?: string) {
    const where: any = { phoneNumber };
    if (farmId) where.farmId = farmId;
    return userRepository.findOne({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
            farmId: true,
            farmName: true,
        },
    });
}

export async function getAllUserRepository(farmId?: string) {
    const where: any = {};
    if (farmId) where.farmId = farmId;
    return userRepository.find({
        where: Object.keys(where).length > 0 ? where : undefined,
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
            isVerified: true,
            farmId: true,
            farmName: true,
        },
    });
}

export async function countAdminUsersRepository(): Promise<number> {
    return userRepository.count({
        where: { role: "admin", isVerified: true },
    });
}

export async function updateUserRepository(
    id: string,
    data: Partial<User>
) {
    await userRepository.update({ id }, data);
    return findUserByIdRepository(id);
}

export async function deleteuserRepository(id: string) {
    return userRepository.delete({ id });
}

// ================= OTP OPERATIONS =================
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

// ================= CUSTOMER REPOSITORIES (FARM SCOPED) =================
export async function createCustomerRepository(data: Partial<CustomerEntity>) {
    const customer = customerRepository.create(data);
    return customerRepository.save(customer);
}

export async function getAllCustomersRepository(farmId?: string) {
    const where: any = {};
    if (farmId) where.farmId = farmId;
    return customerRepository.find({
        where: Object.keys(where).length > 0 ? where : undefined,
        order: { createdAt: "DESC" },
    });
}

export async function findCustomerByIdRepository(id: string, farmId?: string) {
    const where: any = { id };
    if (farmId) where.farmId = farmId;
    return customerRepository.findOne({
        where,
    });
}

export async function updateCustomerRepository(id: string, data: Partial<CustomerEntity>, farmId?: string) {
    const where: any = { id };
    if (farmId) where.farmId = farmId;
    await customerRepository.update(where, data);
    return customerRepository.findOne({ where: { id } });
}

export async function deleteCustomerRepository(id: string, farmId?: string) {
    const where: any = { id };
    if (farmId) where.farmId = farmId;
    return customerRepository.delete(where);
}

// ================= DELIVERY REPOSITORIES (FARM SCOPED) =================
export async function createDeliveryRepository(data: Partial<DeliveryEntity>) {
    const delivery = deliveryRepository.create(data);
    return deliveryRepository.save(delivery);
}

export async function getDeliveriesByDateRepository(date: string, farmId?: string) {
    const where: any = { date };
    if (farmId) where.farmId = farmId;
    return deliveryRepository.find({
        where,
    });
}

export async function getAllDeliveriesRepository(farmId?: string) {
    const where: any = {};
    if (farmId) where.farmId = farmId;
    return deliveryRepository.find({
        where: Object.keys(where).length > 0 ? where : undefined,
        order: { date: "DESC" },
    });
}

// ================= PAYMENT REPOSITORIES (FARM SCOPED) =================
export async function createPaymentRepository(data: Partial<PaymentEntity>) {
    const payment = paymentRepository.create(data);
    return paymentRepository.save(payment);
}

export async function getAllPaymentsRepository(farmId?: string) {
    const where: any = {};
    if (farmId) where.farmId = farmId;
    return paymentRepository.find({
        where: Object.keys(where).length > 0 ? where : undefined,
        order: { date: "DESC" },
    });
}

// ================= PRICE REPOSITORIES (FARM SCOPED) =================
export async function createPriceRepository(data: Partial<PriceEntity>) {
    const price = priceRepository.create(data);
    return priceRepository.save(price);
}

export async function getAllPricesRepository(farmId?: string) {
    const where: any = {};
    if (farmId) where.farmId = farmId;
    return priceRepository.find({
        where: Object.keys(where).length > 0 ? where : undefined,
        order: { effectiveFrom: "DESC" },
    });
}

// ================= ATTENDANCE REPOSITORIES (FARM SCOPED) =================
export async function recordAttendanceRepository(data: Partial<AttendanceEntity>) {
    if (!data.employeeId || !data.date) {
        throw new Error("Employee ID and Date are required");
    }
    const where: any = { employeeId: data.employeeId, date: data.date };
    if (data.farmId) where.farmId = data.farmId;

    const existing = await attendanceRepository.findOne({
        where,
    });
    if (existing) {
        await attendanceRepository.update(existing.id, data);
        return attendanceRepository.findOne({ where: { id: existing.id } });
    }
    const att = attendanceRepository.create(data);
    return attendanceRepository.save(att);
}

export async function getAttendanceByDateRepository(date: string, farmId?: string) {
    const where: any = { date };
    if (farmId) where.farmId = farmId;
    return attendanceRepository.find({
        where,
    });
}

export async function getAllAttendanceRepository(farmId?: string) {
    const where: any = {};
    if (farmId) where.farmId = farmId;
    return attendanceRepository.find({
        where: Object.keys(where).length > 0 ? where : undefined,
        order: { date: "DESC" },
    });
}
