import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddUsernameToOperationConfiguration1712656377180
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "operation-configuration",
      new TableColumn({
        name: "username",
        type: "varchar",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
