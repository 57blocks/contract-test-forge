import { GeneratedTest, TestGenerator } from "./types";

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

export const TEST_GENERATE_SYSTEM_PROMPT = `You are a smart contract testing expert. Generate comprehensive test code using Hardhat and ethers.js with TypeScript.
Return ONLY a raw JSON object without any markdown formatting, code blocks, or backticks. The response should be a valid JSON with the following structure:

Example response (do not include backticks or markdown formatting):
{
  "imports": [
    "import { expect } from 'chai';",
    "import { ethers } from 'hardhat';",
    "import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';",
    "import { Contract, SignerWithAddress } from 'ethers';"
  ],
  "setupCode": "let owner: SignerWithAddress;\\nlet nonOwner: SignerWithAddress;\\nlet contract: Contract;\\n\\nasync function deployFixture() {\\n  const [owner, nonOwner] = await ethers.getSigners();\\n  const Factory = await ethers.getContractFactory('ContractName');\\n  const contract = await Factory.deploy();\\n  await contract.deployed();\\n  return { contract, owner, nonOwner };\\n}\\n\\nbeforeEach(async function () {\\n  const { contract: _contract, owner: _owner, nonOwner: _nonOwner } = await loadFixture(deployFixture);\\n  contract = _contract;\\n  owner = _owner;\\n  nonOwner = _nonOwner;\\n});",
  "testCases": "describe('methodName', () => {\\n  it('should succeed when valid parameters are provided', async function() {\\n    await expect(contract.method())\\n      .to.emit(contract, 'Event')\\n      .withArgs(expectedArgs);\\n  });\\n\\n  it('should fail when invalid parameters are provided', async function() {\\n    await expect(contract.method())\\n      .to.be.revertedWith('Error message');\\n  });\\n});"
}

Important:
1. Do not include any markdown formatting or code blocks
2. Use proper JSON string escaping for newlines (\\n) and quotes
3. The response should be directly parseable by JSON.parse()`;

export function testGeneratePrompt(data: TestGenerator): string {
  return `
Generate TypeScript test code for the following smart contract method.
Use Hardhat and ethers.js for testing.
Include proper type annotations and async/await syntax.

Contract name: ${data.contractName}

Function code:
${data.code}

Test cases to implement:
${data.analysis.testCases
  .map((test) => `- ${test.type}: ${test.description}`)
  .join("\n")}

Return a raw JSON object following the format from the system prompt.
Do not include any markdown formatting, code blocks, or backticks.
Make sure the response can be directly parsed by JSON.parse().
All code strings should use proper JSON escaping for newlines (\\n) and quotes.
`;
}

export const TEST_MERGE_SYSTEM_PROMPT = `You are a smart contract testing expert. Merge multiple test implementations into a single coherent test file.
Return ONLY a raw JSON object without any markdown formatting or code blocks. The response should follow this structure:

Example response:
{
  "imports": [
    "import { expect } from 'chai';",
    "import { ethers } from 'hardhat';",
    "import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';",
    "import { Contract, SignerWithAddress } from 'ethers';"
  ],
  "setupCode": "let owner: SignerWithAddress;\\nlet contract: Contract;\\n\\nasync function deployFixture() {\\n  const [owner] = await ethers.getSigners();\\n  const Factory = await ethers.getContractFactory('ContractName');\\n  const contract = await Factory.deploy();\\n  await contract.deployed();\\n  return { contract, owner };\\n}\\n\\nbeforeEach(async function () {\\n  const { contract: _contract, owner: _owner } = await loadFixture(deployFixture);\\n  contract = _contract;\\n  owner = _owner;\\n});",
  "testCases": "describe('Contract', () => {\\n  describe('method1', () => {\\n    it('should succeed when valid parameters are provided', async function() {\\n      await expect(contract.method1())\\n        .to.emit(contract, 'Event')\\n        .withArgs(expectedArgs);\\n    });\\n\\n    it('should fail when invalid parameters are provided', async function() {\\n      await expect(contract.method1())\\n        .to.be.revertedWith('Error message');\\n    });\\n  });\\n\\n  describe('method2', () => {\\n    it('should transfer\'s tokens correctly', async function() {\\n      await contract.method2(amount);\\n      expect(await contract.balanceOf(owner.address)).to.equal(expectedBalance);\\n    });\\n  });\\n});"
}

Important notes:
1. Keep ALL test cases from the original implementations
2. Do not use placeholder comments like "// test cases..."
3. Include the complete implementation of each test case
4. Maintain the original test logic and assertions
5. Group tests by method name using describe blocks
6. Use proper TypeScript types and async/await syntax`;


export function testMergePrompt(contractName: string, tests: GeneratedTest[]): string {
  return `
Merge the following test implementations into a single coherent test file for contract "${contractName}".
Combine common imports, create a unified setup, and organize test cases by method.

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
1. Combine and deduplicate imports
2. Create a single setup that works for all test cases
3. Group all test cases by method using describe blocks
4. Keep ALL original test cases with their complete implementation
5. Do not use placeholder comments - include actual test code
6. Maintain all assertions and test logic from original implementations
7. Use proper JSON string escaping (\\n for newlines)
8. Return a raw JSON object that can be parsed by JSON.parse()

The response must include the complete implementation of every test case from the original implementations.
Do not summarize or omit any test cases.`;
}
