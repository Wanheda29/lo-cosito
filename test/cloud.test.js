import test from "node:test";
import assert from "node:assert/strict";
import { isCloudConfigured } from "../cloud.js";

test("habilita la sincronización con el proyecto de Supabase configurado", () => {
  assert.equal(isCloudConfigured(), true);
});
