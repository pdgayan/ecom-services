exports.up = async function (knex) {
  await knex.schema.createTable("users", (table) => {
    table.string("id").primary();

    table.string("first_name").notNullable();
    table.string("last_name").notNullable();

    table.string("email").notNullable().unique();

    table.string("password_hash").notNullable();

    table.string("phone");

    table.string("role").notNullable().defaultTo("buyer");

    table.boolean("is_verified").notNullable().defaultTo(false);

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("users");
};
