import test from "node:test";
import assert from "node:assert/strict";
import { backupSummary, createBackup, emptyState, normalizeState, parseBackup } from "../storage.js";
import { deleteProductRecord, productionPlan, recipeAvailability, recipeCost, saleFromOrder, saleRecipeUnits } from "../domain.js";

const sample = () => ({
  ...structuredClone(emptyState),
  ingredients: [{ id: "ing-1", name: "Harina" }],
  products: [{ id: "prd-1", name: "Torta" }],
});

test("crea y restaura un respaldo versionado", () => {
  const backup = createBackup(sample(), "2026-09-18T12:00:00.000Z");
  const restored = parseBackup(JSON.stringify(backup));
  assert.equal(backup.application, "Lo Cositos");
  assert.equal(restored.schemaVersion, 5);
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
  assert.deepEqual(data.sales, [{ ...old.sales[0], recipeUnits: [{ recipeId: recipe.id, quantity: 1 }] }]);
  assert.deepEqual(data.productions, [{ ...old.productions[0], recipeId: recipe.id }]);
  assert.equal(recipeAvailability(data).get(recipe.id), 23);
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
  assert.deepEqual(sale.recipeUnits, [{ recipeId: recipe.id, quantity: 20 }]);
  assert.throws(() => saleFromOrder({ quantity: 1 }, recipe, data.ingredients), /no se puede convertir/);
  const combo = { kind: "combo", items: [{ productId: tray.id, quantity: 2 }] };
  assert.equal(recipeCost(combo, data.ingredients, catalog).unitCost, 240);
});

test("descuenta bandejas y combos por receta y respeta las anulaciones y el historial", () => {
  const tray = { id: "tray", kind: "product", recipeId: "m", unitsPerProduct: 10 };
  const bag = { id: "bag", kind: "product", recipeId: "m", unitsPerProduct: 2 };
  const other = { id: "other", kind: "product", recipeId: "g", unitsPerProduct: 3 };
  const combo = { id: "pack", kind: "combo", items: [{ productId: "tray", quantity: 1 }, { productId: "bag", quantity: 2 }, { productId: "other", quantity: 1 }] };
  const products = [tray, bag, other, combo];
  const productions = [
    { id: "batch", recipeId: "m", producedQuantity: 24 },
    { id: "void", recipeId: "m", producedQuantity: 24, voidedAt: "hoy" },
    { id: "other-batch", recipeId: "g", producedQuantity: 6 },
    { id: "deleted", recipeId: "m", producedQuantity: 7, deletedAt: "hoy" },
  ];
  const sale = { id: "sale", productId: tray.id, quantity: 1, recipeUnits: saleRecipeUnits(tray, 1, products) };
  assert.equal(recipeAvailability({ productions, sales: [sale] }).get("m"), 14);
  tray.unitsPerProduct = 6;
  const data = normalizeState({ products, productions, sales: [sale, { id: "old", productId: combo.id, quantity: 1 }, { ...sale, id: "void-sale", voidedAt: "hoy" }] });
  assert.deepEqual([...recipeAvailability(data)], [["m", 4], ["g", 3]]);
  tray.unitsPerProduct = 8;
  const restored = parseBackup(JSON.stringify(createBackup(data))).data;
  assert.deepEqual([...recipeAvailability(restored)], [["m", 4], ["g", 3]]);
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
