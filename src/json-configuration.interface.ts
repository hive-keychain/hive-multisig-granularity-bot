export interface JsonConfiguration {
  configurations: {
    authority?: string;
    operations: { operationName: string }[];
  }[];
}
