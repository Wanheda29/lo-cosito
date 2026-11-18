import test from "node:test";
import assert from "node:assert/strict";
import { isCloudConfigured } from "../cloud.js";

test("deja la sincronización desactivada en la instalación inicial", () => {
  assert.equal(isCloudConfigured(), false);
});
