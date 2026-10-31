import {Entity,PrimaryGeneratedColumn,Column} from "typeorm"

export type userRole = "admin" | "employee"
@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!:string

    @Column({ type: "varchar" })
name!: string;

@Column({ type: "varchar", unique: true })
email!: string;

@Column({ type: "varchar" })
phoneNumber!: string;

@Column({ type: "varchar" })
password!: string;

    @Column({type:"enum", enum: ["admin", "employee"], default: "employee"})
    role!:userRole

} 