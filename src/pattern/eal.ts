export const eal = {
  common_mistakes_to_avoid: [
    {
      title: "Uninitialized Variables",
      description:
        "Failing to initialize variables in tests can lead to unexpected results.",
      example:
        "Ensure initial token balances are explicitly set before running transfer tests.",
    },
    {
      title: "Hardcoded Address Values",
      description:
        "Avoid hardcoding specific addresses; use test accounts provided by the framework.",
      example: "Use `accounts[0]` instead of hardcoding an Ethereum address.",
    },
    {
      title: "Over-reliance on Global State",
      description:
        "Don't assume the global state persists correctly across tests.",
      example: "Explicitly set state variables for each test case.",
    },
    {
      title: "Ignoring Gas Limits",
      description:
        "Not testing for gas limits can result in runtime issues during deployment.",
      example:
        "Test for reasonable gas consumption in loops or recursive calls.",
    },
    {
      title: "Skipping Revert Testing",
      description:
        "Failing to test for expected reverts can lead to insecure contracts.",
      example:
        "Ensure `require` conditions are correctly tested for failure scenarios.",
    },
    {
      title: "Improper Mock Setup",
      description:
        "Mock contracts or libraries not set up properly can lead to invalid test results.",
      example: "Ensure that mocks are reset between tests to avoid stale data.",
    },
    {
      title: "Event Verification Errors",
      description:
        "Not verifying event parameters can lead to incomplete tests.",
      example: "Check the specific values emitted in `Transfer` events.",
    },
    {
      title: "Incorrect Assert Usage",
      description:
        "Using incorrect assertions can pass tests that should fail.",
      example:
        "Use `assert.equal(actual, expected)` instead of comparing strings directly.",
    },
    {
      title: "Invalid Class or Method References in Third-Party Libraries",
      description:
        "When using third-party libraries such as ethers.js, ensure that the class names and method calls are valid and up-to-date.",
      example:
        "Check that `ethers.Contract` and its methods like `contract.functions` match the library's documentation for the current version.",
    },
  ],
};
