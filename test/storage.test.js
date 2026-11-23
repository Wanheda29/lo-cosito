import test from "node:test";
import assert from "node:assert/strict";
import { backupSummary, createBackup, emptyState, normalizeState, parseBackup } from "../storage.js";
import { deleteProductRecord, productionPlan, recipeCost, saleFromOrder } from "../domain.js";

const sample = () => ({
  ...structuredClone(emptyState),
  ingredients: [{ id: "ing-1", name: "Harina" }],
  products: [{ id: "prd-1", name: "Torta" }],
});

test("crea y restaura un respaldo versionado", () => {
  const backup = createBackup(sample(), "2026-09-18T12:00:00.000Z");
  const restored = parseBackup(JSON.stringify(backup));
  assert.equal(backup.application, "Lo Cositos");
  assert.equal(restored.schemaVersion, 4);
  assert.equal(restored.legacy, false);
  assert.equal(restored.data.ingredients[0].name, "Harina");
});

test("acepta un respaldo anterior sin envoltorio", () => {
  const restored = parseBackup(JSON.stringify(sample()));
  assert.equal(restored.legacy, true);
  assert.equal(restored.data.products.length, 1);
});

test("rechaza colecciones dañadas e identificadores repetidos", () => {
  assert.throws(() => parseBackup(JSON.stringify({ ingredients: "no-es-lista" })), /colección/);
  assert.throws(() => parseBackup(JSON.stringify({ ingredients: [{ id: "1" }, { id: "1" }] })), /repetidos/);
});

test("resume el contenido del respaldo", () => {
  assert.deepEqual(backupSummary(sample()), { ingredients: 1, stockAdjustments: 0, purchases: 0, products: 1, recipes: 0, productions: 0, clients: 0, orders: 0, sales: 0 });
});

test("separa una receta anterior sin alterar pedidos, producciones, ventas ni costo por unidad", () => {
  const old = {
    ingredients: [{ id: "soja", name: "Soja", baseUnit: "g", stock: 2000, averageCost: 0.5 }],
    products: [{ id: "m", name: "Milanesas de soja", salePrice: 360, yieldQuantity: 24, recipe: [{ ingredientId: "soja", quantity: 480 }], optionalCosts: { labor: 48 } }],
    orders: [{ id: "o", productId: "m", quantity: 1, totalPrice: 360, status: "pendiente" }],
    sales: [{ id: "s", productId: "m", quantity: 1, unitCostSnapshot: 12 }],
    productions: [{ id: "p", productId: "m", producedQuantity: 24 }],
  };
  const data = parseBackup(JSON.stringify({ application: "Lo Cosito", schemaVersion: 3, data: old })).data;
  const [product, recipe] = data.products;
  assert.equal(product.id, "m");
  assert.equal(product.salePrice, 360);
  assert.equal(product.unitsPerProduct, 1);
  assert.equal(recipe.id, product.recipeId);
  assert.equal(recipe.yieldQuantity, 24);
  assert.equal(Object.hasOwn(recipe, "salePrice"), false);
  assert.equal(recipeCost(product, data.ingredients, data.products).unitCost, 12);
  assert.deepEqual(data.orders, old.orders);
  assert.deepEqual(data.sales, old.sales);
  assert.deepEqual(data.productions, old.productions);
  assert.deepEqual(normalizeState(data), data);
  assert.throws(() => deleteProductRecord(recipe, data.orders, "hoy", null, data.products), /productos que usan/);

  const tray = { id: "pack", kind: "product", recipeId: recipe.id, unitsPerProduct: 10, salePrice: 360 };
  const catalog = [...data.products, tray];
  const batch = productionPlan(recipe, data.ingredients);
  assert.equal(batch.producedQuantity, 24);
  assert.equal(batch.requirements[0].required, 480);
  assert.equal(recipeCost(tray, data.ingredients, catalog).unitCost, 120);
  const sale = saleFromOrder({ id: "tray-order", quantity: 2, totalPrice: 720 }, tray, data.ingredients, "hoy", "sale", catalog);
  assert.equal(sale.quantity, 2);
  assert.equal(sale.unitCostSnapshot, 120);
  assert.throws(() => saleFromOrder({ quantity: 1 }, recipe, data.ingredients), /no se puede convertir/);
  const combo = { kind: "combo", items: [{ productId: tray.id, quantity: 2 }] };
  assert.equal(recipeCost(combo, data.ingredients, catalog).unitCost, 240);
});

test("los datos anteriores sin historial de ajustes siguen siendo válidos", () => {
  const old = sample();
  delete old.stockAdjustments;
  const restored = parseBackup(JSON.stringify({ application: "Lo Cosito", schemaVersion: 1, data: old }));
  assert.deepEqual(restored.data.stockAdjustments, []);
});

test("el respaldo conserva el historial de ajustes", () => {
  const data = sample();
  data.stockAdjustments.push({ id: "adj-1", ingredientId: "ing-1", delta: -50, reason: "family" });
  const restored = parseBackup(JSON.stringify(createBackup(data)));
  assert.equal(restored.data.stockAdjustments[0].reason, "family");
});

test("el respaldo conserva costos manuales y su historial", () => {
  const data = sample();
  data.ingredients[0].averageCost = 0.055;
  data.ingredients[0].costHistory = [{ previousCost: 0, newCost: 0.055, amount: 55, costUnit: "kg", createdAt: "2026-10-07T12:00:00Z", actorEmail: null }];
  const restored = parseBackup(JSON.stringify(createBackup(data)));
  assert.deepEqual(restored.data.ingredients[0], data.ingredients[0]);
});
