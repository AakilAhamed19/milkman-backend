import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from "typeorm";

export type otpPurpose = "register" | "reset_password";
export type userRole = "admin" | "employee";

// FARM ENTITY (Organization / Farm representing each Dairy business)
@Entity()
export class Farm {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar" })
    name!: string;

    @Column({ type: "varchar", nullable: true })
    ownerEmail!: string | null;

    @Column({ type: "varchar", nullable: true })
    phoneNumber!: string | null;

    @Column({ type: "varchar", nullable: true })
    address!: string | null;

    @CreateDateColumn()
    createdAt!: Date;
}

// USER ENTITY (Admin or Employee belonging to a Farm)
@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: "varchar", nullable: true })
    farmId!: string | null | undefined;

    @Column({ type: "varchar", nullable: true })
    farmName!: string | null | undefined;

    @Column({ type: "varchar" })
    name!: string;

    @Column({ type: "varchar", unique: true })
    email!: string;

    @Column({ type: "varchar" })
    phoneNumber!: string;

    @Column({ type: "varchar" })
    password!: string;

    @Column({
        type: "enum",
        enum: ["admin", "employee"],
        default: "employee",
    })
    role!: userRole;

    @Column({ type: "boolean", default: false })
    isVerified!: boolean;

    // Employee must change temporary password after first login
    @Column({ type: "boolean", default: false })
    mustChangePassword!: boolean;
}

// OTP ENTITY
@Entity()
export class otp {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar" })
    email!: string;

    @Column({ type: "varchar" })
    otpHash!: string;

    @Column({ type: "timestamp" })
    expiresAt!: Date;

    @Column({
        type: "enum",
        enum: ["register", "reset_password"],
    })
    purpose!: otpPurpose;

    @Column({ type: "int", default: 0 })
    attempts!: number;

    @Column({ type: "boolean", default: false })
    isUsed!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}

// CUSTOMER ENTITY (Scoped to Farm)
@Entity()
export class CustomerEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: "varchar", nullable: true })
    farmId!: string | null | undefined;

    @Column({ type: "varchar" })
    name!: string;

    @Column({ type: "varchar" })
    phone!: string;

    @Column({ type: "varchar" })
    area!: string;

    @Column({ type: "varchar", default: "cow" })
    milkType!: string;

    @Column({ type: "float", default: 0 })
    morningQty!: number;

    @Column({ type: "float", default: 0 })
    eveningQty!: number;

    @Column({ type: "float", nullable: true })
    priceOverride!: number | null;

    @Column({ type: "varchar" })
    startDate!: string;

    @Column({ type: "boolean", default: true })
    active!: boolean;

    @Column({ type: "varchar", default: "retail" })
    customerType!: "retail" | "wholesale";

    @Column({ type: "varchar", nullable: true })
    businessName!: string | null;

    @CreateDateColumn()
    createdAt!: Date;
}

// DELIVERY ENTITY (Scoped to Farm)
@Entity()
export class DeliveryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: "varchar", nullable: true })
    farmId!: string | null | undefined;

    @Column({ type: "varchar" })
    customerId!: string;

    @Column({ type: "varchar" })
    date!: string;

    @Column({ type: "varchar" })
    shift!: "morning" | "evening";

    @Column({ type: "float" })
    quantity!: number;

    @Column({ type: "float" })
    unitPrice!: number;

    @CreateDateColumn()
    createdAt!: Date;
}

// PAYMENT ENTITY (Scoped to Farm)
@Entity()
export class PaymentEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: "varchar", nullable: true })
    farmId!: string | null | undefined;

    @Column({ type: "varchar" })
    customerId!: string;

    @Column({ type: "varchar" })
    date!: string;

    @Column({ type: "float" })
    amount!: number;

    @Column({ type: "varchar", default: "cash" })
    mode!: "cash" | "upi" | "bank";

    @Column({ type: "text", nullable: true })
    note!: string | null;

    @CreateDateColumn()
    createdAt!: Date;
}

// PRICE ENTITY (Scoped to Farm)
@Entity()
export class PriceEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: "varchar", nullable: true })
    farmId!: string | null | undefined;

    @Column({ type: "varchar" })
    milkType!: string;

    @Column({ type: "float" })
    amount!: number;

    @Column({ type: "varchar" })
    effectiveFrom!: string;

    @CreateDateColumn()
    createdAt!: Date;
}

// ATTENDANCE ENTITY (Scoped to Farm)
@Entity()
export class AttendanceEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: "varchar", nullable: true })
    farmId!: string | null | undefined;

    @Column({ type: "varchar" })
    employeeId!: string;

    @Column({ type: "varchar" })
    date!: string;

    @Column({ type: "varchar", default: "present" })
    status!: "present" | "half-day" | "absent";

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @CreateDateColumn()
    createdAt!: Date;
}
