import { GeneratedTest, TestGenerator, TestPattern } from "./types";

function formatTestingPrinciples(patterns: TestPattern): string {
  const principles = patterns.evm_unit_test_principles
    .map((p) => `${p.title}: ${p.description}`)
    .join("\n");

  const mistakes = patterns.common_mistakes_to_avoid
    .map((m) => `${m.title}: ${m.description}`)
    .join("\n");

  return `
Testing Principles:
${principles}

Common Mistakes to Avoid:
${mistakes}`;
}

export const CONTRACT_ANALYZE_SYSTEM_PROMPT =
  "You are a smart contract testing expert. Analyze the given Solidity function and suggest comprehensive test cases that cover all important scenarios.";

export const contractAnalyzePrompt = (code: string) => `
Analyze the following Solidity function and suggest test cases.
Return ONLY a JSON array of test cases, with no additional text.
Each test case should have 'type' (either "positive" or "negative") and 'description' fields.

Example response format:
[
  {
    "type": "positive",
    "description": "should succeed when valid amount is transferred"
  },
  {
    "type": "negative",
    "description": "should fail when amount exceeds balance"
  }
]

Consider:
1. Input validation
2. State changes
3. Access control
4. Edge cases
5. Business logic
6. Events emission

Function code:
${code}
`;

export const TEST_GENERATE_SYSTEM_PROMPT = (
  patterns: TestPattern
) => `You are a smart contract testing expert. Generate comprehensive test code using Hardhat and ethers.js with TypeScript.
Follow these testing principles and patterns:

${formatTestingPrinciples(patterns)}

Return ONLY a raw JSON object without any markdown formatting, code blocks, or backticks. The response should be a valid JSON with the following structure:

Example response (do not include backticks or markdown formatting):
{
  "imports": [
    "import { expect } from 'chai';",
    "import { ethers } from 'hardhat';",
    "import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';",
    "import { Contract, SignerWithAddress } from 'ethers';"
  ],
  "setupCode": "let owner: SignerWithAddress;\\nlet nonOwner: SignerWithAddress;\\nlet contract: Contract;\\n\\nasync function deployFixture() {\\n  const [owner, nonOwner] = await ethers.getSigners();\\n  const Factory = await ethers.getContractFactory(\\"ContractName\\");\\n  const contract = await Factory.deploy();\\n  await contract.deployed();\\n  return { contract, owner, nonOwner };\\n}\\n\\nbeforeEach(async function () {\\n  const { contract: _contract, owner: _owner, nonOwner: _nonOwner } = await loadFixture(deployFixture);\\n  contract = _contract;\\n  owner = _owner;\\n  nonOwner = _nonOwner;\\n});",
  "testCases": "describe(\\"methodName\\", () => {\\n  it(\\"should succeed when valid parameters are provided\\", async function() {\\n    await expect(contract.method())\\n      .to.emit(contract, \\"Event\\")\\n      .withArgs(expectedArgs);\\n  });\\n\\n  it(\\"should fail when invalid parameters are provided\\", async function() {\\n    await expect(contract.method())\\n      .to.be.revertedWith(\\"Error message\\");\\n  });\\n});"
}

Important:
1. Do not include any markdown formatting or code blocks
2. Use proper JSON string escaping for newlines (\\n) and quotes (\\" not ')
3. The response should be directly parseable by JSON.parse()
4. Include tests for edge cases and boundary conditions
5. Verify all events and their parameters
6. Include gas usage checks for complex operations
7. Test both success and revert cases`;

export function testGeneratePrompt(data: TestGenerator): string {
  return `
Generate TypeScript test code for the following smart contract method.
Use Hardhat and ethers.js for testing.

Contract name: ${data.contractName}

Function code:
${data.code}

Test cases to implement:
${data.analysis.testCases
  .map((test) => `- ${test.type}: ${test.description}`)
  .join("\n")}

Requirements:
1. Include proper type annotations and async/await syntax
2. Use fixtures to ensure clean state between tests
3. Test edge cases and boundary conditions
4. Verify events and their parameters
5. Include gas usage checks for complex operations
6. Test both success and revert scenarios
7. Use framework-provided accounts (no hardcoded addresses)
8. Initialize all variables explicitly
9. Use proper assertion methods from chai
10. Follow proper ethers.js API usage

Return a raw JSON object following the format from the system prompt.
Do not include any markdown formatting, code blocks, or backticks.
Make sure the response can be directly parsed by JSON.parse().
All code strings should use proper JSON escaping for newlines (\\n) and quotes (\\" not ').`;
}

export const TEST_MERGE_SYSTEM_PROMPT = `You are a smart contract testing expert. Merge multiple test implementations into a single coherent test file.
Return ONLY the complete TypeScript test file content, without any markdown formatting, explanations, or code blocks.

Example test file structure:
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Contract, SignerWithAddress } from "ethers";

describe("ContractName", () => {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let contract: Contract;

  async function deployFixture() {
    const [owner, nonOwner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContractName");
    const contract = await Factory.deploy();
    await contract.deployed();
    return { contract, owner, nonOwner };
  }

  beforeEach(async () => {
    const { contract: _contract, owner: _owner, nonOwner: _nonOwner } = await loadFixture(deployFixture);
    contract = _contract;
    owner = _owner;
    nonOwner = _nonOwner;
  });

  describe("method1", () => {
    it("should succeed when valid parameters are provided", async function() {
      await expect(contract.method1())
        .to.emit(contract, "Event")
        .withArgs(expectedArgs);
    });
  });
});

Requirements:
1. Return ONLY the test file content - no markdown, no explanations, no code blocks
2. Keep ALL test cases from the original implementations
3. Do not use placeholder comments - include actual test code
4. Include the complete implementation of each test case
5. Maintain the original test logic and assertions
6. Group tests by method name using describe blocks
7. Use proper TypeScript types and async/await syntax
8. Ensure proper error handling and event verification`;

export function testMergePrompt(
  contractName: string,
  tests: GeneratedTest[]
): string {
  return `
Merge the following test implementations into a single test file for contract "${contractName}".

Test implementations to merge:

${tests
  .map(
    (test, index) => `
Implementation ${index + 1}:
Imports:
${test.imports.join("\n")}

Setup:
${test.setupCode}

Test Cases:
${test.testCases}
`
  )
  .join("\n\n")}

Requirements:
1. Return ONLY the complete test file content
2. Do not include any markdown formatting or explanations
3. Do not wrap the response in code blocks
4. Combine and deduplicate imports
5. Create a single setup that works for all test cases
6. IMPORTANT: Place beforeEach inside the main describe block, not outside
7. Group all test cases by method using describe blocks
8. Keep ALL original test cases with their complete implementation
9. Do not use placeholder comments - include actual test code
10. Maintain all assertions and test logic from original implementations
11. Use proper TypeScript types and async/await syntax
12. Do not reduce the existing test cases

Return the complete test file content directly, without any additional text or formatting.`;
}

export const TEST_REFACTOR_SYSTEM_PROMPT = `You are a smart contract testing expert. Review and refactor the test code to ensure best practices and fix any issues.
Return ONLY the refactored test file content, without any markdown formatting, explanations, or code blocks.

Review and fix the following potential issues:
1. Ensure beforeEach is inside the main describe block
2. Check for duplicate test cases
3. Verify proper error handling
4. Ensure consistent naming conventions
5. Check for proper async/await usage
6. Verify proper event testing
7. Ensure proper setup and teardown
8. Check for hardcoded values
9. Verify proper type usage
10. Ensure proper test isolation

Example of proper test structure:

import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Contract, SignerWithAddress } from "ethers";

describe("ContractName", () => {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let contract: Contract;

  async function deployFixture() {
    const [owner, nonOwner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContractName");
    const contract = await Factory.deploy();
    await contract.deployed();
    return { contract, owner, nonOwner };
  }

  beforeEach(async () => {
    const { contract: _contract, owner: _owner, nonOwner: _nonOwner } = await loadFixture(deployFixture);
    contract = _contract;
    owner = _owner;
    nonOwner = _nonOwner;
  });

  describe("method1", () => {
    it("should succeed with valid parameters", async function() {
      await expect(contract.method1())
        .to.emit(contract, "Event")
        .withArgs(expectedArgs);
    });
  });
});`;

export function testRefactorPrompt(
  contractName: string,
  testCode: string
): string {
  return `
Review and refactor the following test code for contract "${contractName}".
Fix any issues and ensure it follows best practices.

Current test code:
${testCode}

Requirements:
1. Return ONLY the refactored test code
2. Do not include any markdown formatting or explanations
3. Do not wrap the response in code blocks
4. Ensure beforeEach is inside the main describe block
5. Remove any duplicate test cases
6. Fix any improper error handling
7. Use consistent naming conventions
8. Fix any async/await issues
9. Ensure proper event testing
10. Remove any hardcoded values
11. Fix any type issues
12. Ensure proper test isolation
13. Do not remove or reduce test coverage
14. Keep all existing test cases but improve their implementation

Return the refactored test code directly, without any additional text or formatting.`;
}
