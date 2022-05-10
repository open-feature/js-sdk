import { greet } from "../src/index";

describe("greet", () => {
  it("should return greeting", () => {
    const result = greet("hi");
    expect(result).toEqual("hi");
  });
});
