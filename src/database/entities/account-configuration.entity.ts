import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { OperationConfiguration } from "./operation-configuration.entity";

@Entity({ name: "account-configuration" })
export class AccountConfiguration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  updatedAt: Date;

  @OneToMany(
    () => OperationConfiguration,
    (operationConfiguration) => operationConfiguration.accountConfiguration
  )
  operationConfigurations: OperationConfiguration[];

  constructor(obj: Partial<AccountConfiguration>) {
    if (!obj) return;
    this.id = obj.id;
  }
}
