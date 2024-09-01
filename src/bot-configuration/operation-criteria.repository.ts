import { DatabaseModule } from "../database/database.module";
import { OperationCriteria } from "../database/entities/operation-criteria.entity";

const getRepo = () => {
  return DatabaseModule.getDatabase().getRepository(OperationCriteria);
};

const create = async (criteria: Partial<OperationCriteria>) => {
  await getRepo().save(criteria);
};

const update = async () => {};

export const OperationCriteriaRepository = { create };
