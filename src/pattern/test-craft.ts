export const testCraft = {
  evm_unit_test_principles: [
    {
      title: "Write Atomic Tests",
      description:
        "Ensure each test covers only one specific functionality to make debugging easier.",
      examples: "Test deposit functionality independently of withdrawal logic.",
    },
    {
      title: "Focus on Edge Cases",
      description:
        "Include tests for boundary conditions, such as minimum, maximum, and zero values.",
      examples:
        "For a token transfer function, test 0, 1, and maximum token values.",
    },
    {
      title: "Validate Events Emitted",
      description:
        "Check that the correct events are emitted during contract execution.",
      example: "Verify `Transfer` event when tokens are transferred.",
    },
    {
      title: "Use Mock Data for External Calls",
      description:
        "Replace external contract calls with mock data to ensure isolation and control.",
      example: "Use Hardhat's `mock` library to simulate an oracle response.",
    },
    {
      title: "Ensure Gas Efficiency",
      description:
        "Write tests that monitor gas usage to prevent excessive costs.",
      example:
        "Test that a loop in the contract doesn't exceed the gas limit for typical inputs.",
    },
    {
      title: "Revert Test Cases",
      description:
        "Ensure the contract reverts as expected when invalid inputs are provided.",
      example:
        "Test that `transfer` reverts when the sender has insufficient balance.",
    },
    {
      title: "Clean State Between Tests",
      description:
        "Use fixtures or re-deploy contracts between tests to ensure a clean state.",
      example:
        "Use `beforeEach` to deploy a fresh contract instance before each test.",
    },
    {
      title: "Align Unit Test Logic with Contract Workflow",
      description:
        "Ensure unit test logic follows the EVM contract workflow structure, including preconditions, processes, and expected outcomes.",
      example:
        "For a `transfer` function, the unit test should: (1) Verify sufficient balance and validate input parameters (precondition), (2) Execute the transfer logic and update balances (process), (3) Check emitted events and final state changes (expected outcomes).",
    },
  ],
};
