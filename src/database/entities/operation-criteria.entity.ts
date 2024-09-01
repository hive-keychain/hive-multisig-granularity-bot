import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { IOperand, OperationsUtils } from "../../utils/operations.utils";
import { OperationConfiguration } from "./operation-configuration.entity";

@Entity({ name: "operation-criteria" })
export class OperationCriteria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  operationField: string;

  @Column({
    type: "enum",
    enum: OperationsUtils.OPERAND_LIST,
  })
  operand: IOperand;

  @Column()
  value: string;

  @ManyToOne(
    () => OperationConfiguration,
    (operationConfiguration) => operationConfiguration.operationCriterias,
    {
      nullable: false,
    }
  )
  operationConfiguration: OperationConfiguration;

  @OneToMany(
    () => OperationConfiguration,
    (operationConfiguration) => operationConfiguration.accountConfiguration
  )
  operationConfigurations: OperationConfiguration[];

  constructor(obj: Partial<OperationCriteria>) {
    if (!obj) return;
    this.id = obj.id;
  }
}
