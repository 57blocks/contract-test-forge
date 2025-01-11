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
