export interface ProjectConfig {
  name: string;
  version: string;
  contracts_dir: string;
  test_dir: string;
  test_framework?: string;
}

export interface ContractFunction {
  name: string;
  visibility: string;
  params: Array<{
    name: string;
    type: string;
  }>;
  returns?: Array<{
    type: string;
  }>;
  stateMutability?: string;
  code: string;
}
