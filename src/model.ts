import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type otpPurpose = "register" | "reset_password";
export type userRole = "admin" | "employee";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar" })
    name!: string;

    @Column({ type: "varchar", unique: true })
    email!: string;

    @Column({ type: "varchar" })
    phoneNumber!: string;

    @Column({ type: "varchar" })
    password!: string;

    @Column({ type: "enum", enum: ["admin", "employee"], default: "employee" })
    role!: userRole;

     @Column({ type: "boolean", default: false })
      isVerified!: boolean;
   }

// otp
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

  @Column({ type: "enum", enum: ["register", "reset_password"] })
  purpose!: otpPurpose;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ type: "boolean", default: false })
  isUsed!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
