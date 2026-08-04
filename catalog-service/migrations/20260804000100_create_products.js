exports.up = async function (knex) {
  await knex.schema.createTable("products", (table) => {
    table.string("id").primary();
    table.string("name").notNullable();
    table.string("manufacturer");
    table.string("category");
    table.string("categoryId");
    table.string("image_url");
    table.string("availability");
    table.jsonb("certification");
    table.string("country");
    table.integer("stock");
    table.string("leadTime");
    table.decimal("price", 14, 2);
    table.string("priceUnit");
    table.text("description");
    table.jsonb("specifications");
    table.jsonb("documents");
    table.string("supplierId");
    table.string("condition");
    table.string("natoStockNumber");
    table.string("exportControl");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("products");
};
