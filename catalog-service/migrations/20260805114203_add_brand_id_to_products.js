/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("products", (table) => {
    table.string("brand_id");
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("products", (table) => {
    table.dropColumn("brand_id");
  });
};
