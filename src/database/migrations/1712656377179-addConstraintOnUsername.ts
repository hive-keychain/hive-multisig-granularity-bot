import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConstraintOnUsername1712656377179
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE \`account-configuration\`
        ADD UNIQUE INDEX \`unique_username\` (\`username\`) USING BTREE;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
