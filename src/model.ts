import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from "typeorm";

export type otpPurpose = "register" | "reset_password";
export type userRole = "admin" | "employee";

// ==========================================
// FARM ENTITY (Core Organization / Farm)
// ==========================================
@Entity("farms")
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

    // Relational links to all entities belonging to this farm
    @OneToMany(() => User, (user) => user.farm)
    users!: User[];

    @OneToMany(() => CustomerEntity, (customer) => customer.farm)
    customers!: CustomerEntity[];

    @OneToMany(() => DeliveryEntity, (delivery) => delivery.farm)
    deliveries!: DeliveryEntity[];

    @OneToMany(() => PaymentEntity, (payment) => payment.farm)
    payments!: PaymentEntity[];

    @OneToMany(() => PriceEntity, (price) => price.farm)
    prices!: PriceEntity[];

    @OneToMany(() => AttendanceEntity, (attendance) => attendance.farm)
    attendances!: AttendanceEntity[];
}

// ==========================================
// USER ENTITY (Admin or Employee of a Farm)
// ==========================================
@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: "varchar", nullable: true })
    farmId!: string | null | undefined;

    @ManyToOne(() => Farm, (farm) => farm.users, { onDelete: "CASCADE" })
    @JoinColumn({ name: "farmId" })
    farm?: Farm | null;

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

// ==========================================
// OTP ENTITY
// ==========================================
@Entity("otps")
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

// ==========================================
// CUSTOMER ENTITY (Scoped & Related to Farm)
// ==========================================
@Entity("customers")
export class CustomerEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: "varchar", nullable: true })
    farmId!: string | null | undefined;

    @ManyToOne(() => Farm, (farm) => farm.customers, { onDelete: "CASCADE" })
    @JoinColumn({ name: "farmId" })
    farm?: Farm | null;

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

// ==========================================
// DELIVERY ENTITY (Scoped & Related to Farm)
// ==========================================
@Entity("deliveries")
export class DeliveryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: "varchar", nullable: true })
    farmId!: string | null | undefined;

    @ManyToOne(() => Farm, (farm) => farm.deliveries, { onDelete: "CASCADE" })
    @JoinColumn({ name: "farmId" })
    farm?: Farm | null;

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

// ==========================================
// PAYMENT ENTITY (Scoped & Related to Farm)
// ==========================================
@Entity("payments")
export class PaymentEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: "varchar", nullable: true })
    farmId!: string | null | undefined;

    @ManyToOne(() => Farm, (farm) => farm.payments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "farmId" })
    farm?: Farm | null;

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

// ==========================================
// PRICE ENTITY (Scoped & Related to Farm)
// ==========================================
@Entity("prices")
export class PriceEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: "varchar", nullable: true })
    farmId!: string | null | undefined;

    @ManyToOne(() => Farm, (farm) => farm.prices, { onDelete: "CASCADE" })
    @JoinColumn({ name: "farmId" })
    farm?: Farm | null;

    @Column({ type: "varchar" })
    milkType!: string;

    @Column({ type: "float" })
    amount!: number;

    @Column({ type: "varchar" })
    effectiveFrom!: string;

    @CreateDateColumn()
    createdAt!: Date;
}

// ==========================================
// ATTENDANCE ENTITY (Scoped & Related to Farm)
// ==========================================
@Entity("attendances")
export class AttendanceEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: "varchar", nullable: true })
    farmId!: string | null | undefined;

    @ManyToOne(() => Farm, (farm) => farm.attendances, { onDelete: "CASCADE" })
    @JoinColumn({ name: "farmId" })
    farm?: Farm | null;

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
