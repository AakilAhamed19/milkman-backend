import { AppDataSource } from "./datasource";
import {
    TenantEntity,
    User,
    otp,
    otpPurpose,
    CustomerEntity,
    DeliveryEntity,
    PaymentEntity,
    PriceEntity,
    AttendanceEntity
} from "./model";

const tenantRepository = AppDataSource.getRepository(TenantEntity);
const userRepository = AppDataSource.getRepository(User);
const otpRepository = AppDataSource.getRepository(otp);
const customerRepository = AppDataSource.getRepository(CustomerEntity);
const deliveryRepository = AppDataSource.getRepository(DeliveryEntity);
const paymentRepository = AppDataSource.getRepository(PaymentEntity);
const priceRepository = AppDataSource.getRepository(PriceEntity);
const attendanceRepository = AppDataSource.getRepository(AttendanceEntity);

// ================= TENANT OPERATIONS =================
export async function createTenantRepository(name: string, ownerEmail: string) {
    const tenant = tenantRepository.create({ name, ownerEmail });
    return tenantRepository.save(tenant);
}

export async function findTenantByIdRepository(id: string) {
    return tenantRepository.findOne({ where: { id } });
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
            tenantId: true,
            dairyName: true,
        },
    });
}

export async function findUserByNameRepository(name: string, tenantId?: string) {
    const where: any = { name };
    if (tenantId) where.tenantId = tenantId;
    return userRepository.find({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
            tenantId: true,
            dairyName: true,
        },
    });
}

export async function findUserByMobileRepository(phoneNumber: string, tenantId?: string) {
    const where: any = { phoneNumber };
    if (tenantId) where.tenantId = tenantId;
    return userRepository.findOne({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
            tenantId: true,
            dairyName: true,
        },
    });
}

export async function getAllUserRepository(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    return userRepository.find({
        where: Object.keys(where).length > 0 ? where : undefined,
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
            isVerified: true,
            tenantId: true,
            dairyName: true,
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

// ================= CUSTOMER REPOSITORIES =================
export async function createCustomerRepository(data: Partial<CustomerEntity>) {
    const customer = customerRepository.create(data);
    return customerRepository.save(customer);
}

export async function getAllCustomersRepository(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    return customerRepository.find({
        where: Object.keys(where).length > 0 ? where : undefined,
        order: { createdAt: "DESC" },
    });
}

export async function findCustomerByIdRepository(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    return customerRepository.findOne({
        where,
    });
}

export async function updateCustomerRepository(id: string, data: Partial<CustomerEntity>, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    await customerRepository.update(where, data);
    return customerRepository.findOne({ where: { id } });
}

export async function deleteCustomerRepository(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    return customerRepository.delete(where);
}

// ================= DELIVERY REPOSITORIES =================
export async function createDeliveryRepository(data: Partial<DeliveryEntity>) {
    const delivery = deliveryRepository.create(data);
    return deliveryRepository.save(delivery);
}

export async function getDeliveriesByDateRepository(date: string, tenantId?: string) {
    const where: any = { date };
    if (tenantId) where.tenantId = tenantId;
    return deliveryRepository.find({
        where,
    });
}

export async function getAllDeliveriesRepository(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    return deliveryRepository.find({
        where: Object.keys(where).length > 0 ? where : undefined,
        order: { date: "DESC" },
    });
}

// ================= PAYMENT REPOSITORIES =================
export async function createPaymentRepository(data: Partial<PaymentEntity>) {
    const payment = paymentRepository.create(data);
    return paymentRepository.save(payment);
}

export async function getAllPaymentsRepository(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    return paymentRepository.find({
        where: Object.keys(where).length > 0 ? where : undefined,
        order: { date: "DESC" },
    });
}

// ================= PRICE REPOSITORIES =================
export async function createPriceRepository(data: Partial<PriceEntity>) {
    const price = priceRepository.create(data);
    return priceRepository.save(price);
}

export async function getAllPricesRepository(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    return priceRepository.find({
        where: Object.keys(where).length > 0 ? where : undefined,
        order: { effectiveFrom: "DESC" },
    });
}

// ================= ATTENDANCE REPOSITORIES =================
export async function recordAttendanceRepository(data: Partial<AttendanceEntity>) {
    if (!data.employeeId || !data.date) {
        throw new Error("Employee ID and Date are required");
    }
    const where: any = { employeeId: data.employeeId, date: data.date };
    if (data.tenantId) where.tenantId = data.tenantId;

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

export async function getAttendanceByDateRepository(date: string, tenantId?: string) {
    const where: any = { date };
    if (tenantId) where.tenantId = tenantId;
    return attendanceRepository.find({
        where,
    });
}

export async function getAllAttendanceRepository(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    return attendanceRepository.find({
        where: Object.keys(where).length > 0 ? where : undefined,
        order: { date: "DESC" },
    });
}
