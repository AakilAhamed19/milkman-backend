import {DataSource} from "typeorm"
import {TenantEntity, User, otp, CustomerEntity, DeliveryEntity, PaymentEntity, PriceEntity, AttendanceEntity} from "./model"
import "dotenv/config";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: `${process.env.DB_HOST}`,
    port: Number(process.env.DB_PORT) || 5432,
    username: `${process.env.DB_USER}`,
    password: `${process.env.DB_PASSWORD}`,
    database: `${process.env.DB_NAME}`,
    entities: [TenantEntity, User, otp, CustomerEntity, DeliveryEntity, PaymentEntity, PriceEntity, AttendanceEntity],
    synchronize: true,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})
