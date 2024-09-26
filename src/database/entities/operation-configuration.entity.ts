import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { IOperationName } from "../../utils/operations.utils";
import { AccountConfiguration } from "./account-configuration.entity";
import { OperationCriteria } from "./operation-criteria.entity";

@Entity({ name: "operation-configuration" })
export class OperationConfiguration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  username: string;

  @Column()
  operation: IOperationName;

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

  @ManyToOne(
    () => AccountConfiguration,
    (accountConfiguration) => accountConfiguration.operationConfigurations,
    {
      nullable: false,
    }
  )
  accountConfiguration: AccountConfiguration;

  @OneToMany(
    () => OperationCriteria,
    (operationCriteria) => operationCriteria.operationConfiguration
  )
  operationCriterias: OperationCriteria[];

  constructor(obj: Partial<OperationConfiguration>) {
    if (!obj) return;
  }
}
