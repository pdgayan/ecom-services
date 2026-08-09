exports.up = async function (knex) {
  await knex("users").where({ role: "customer" }).update({ role: "buyer" });
};

exports.down = async function (knex) {
  await knex("users").where({ role: "buyer" }).update({ role: "customer" });
};
