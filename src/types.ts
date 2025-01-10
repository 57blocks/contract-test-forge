export interface ProjectConfig {
  name: string;
  version: string;
  contracts_dir: string;
  test_dir: string;
  test_framework?: string;
}
