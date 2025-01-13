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

export interface TestCase {
  type: 'positive' | 'negative';
  description: string;
}

export interface TestAnalysis {
  methodName: string;
  testCases: TestCase[];
}

export interface TestGenerator {
  contractName: string;
  code: string;
  analysis: TestAnalysis;
}

export interface GeneratedTest {
  imports: string[];
  setupCode: string;
  testCases: string;
}

export interface AiConfig {
  model: string;
  api_key: string;
}

export interface TestPattern {
    evm_unit_test_principles: Array<{
      title: string;
      description: string;
      examples?: string;
      example?: string;
    }>;
    common_mistakes_to_avoid: Array<{
      title: string;
      description: string;
      example: string;
    }>;
  }
