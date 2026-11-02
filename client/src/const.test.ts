import { expect, it } from "vitest";
import { getLoginUrl } from "./const";
it("routes authentication through the local login page", () => {
  expect(getLoginUrl()).toBe("/login");
});
