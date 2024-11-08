import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddExtraDataFieldOperationConfiguration1712656377181
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "operation-configuration",
      new TableColumn({
        name: "extraData",
        type: "longtext",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
