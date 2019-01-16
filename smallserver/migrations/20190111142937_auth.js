exports.up = function(knex, Promise) {
  var createUsersTable = knex.schema.createTable('users', function(table) {
    table
      .increments('user_id')
      .primary()
      .unique()
      .notNullable();
    table
      .string('username')
      .unique()
      .notNullable();
    table
      .string('username_lower_case')
      .unique()
      .notNullable();
    table
      .string('email')
      .unique()
      .notNullable();
    table
      .string('email_lower_case')
      .unique()
      .notNullable();
    table
      .timestamp('created_at')
      .notNullable()
      .defaultTo(knex.raw('now()'));
    table
      .timestamp('updated_at')
      .notNullable()
      .defaultTo(knex.raw('now()'));
  });

  var createPasswordsTable = knex.schema.createTable('passwords', function(table) {
    table
      .integer('user_id')
      .primary()
      .unique()
      .notNullable();
    table.foreign('user_id').references('users.user_id');
    table.string('hash', 270).notNullable();
    table
      .timestamp('created_at')
      .notNullable()
      .defaultTo(knex.raw('now()'));
    table
      .timestamp('updated_at')
      .notNullable()
      .defaultTo(knex.raw('now()'));
  });

  var createSessionsTable = knex.schema.createTable('sessions', function(table) {
    table
      .uuid('token')
      .primary()
      .unique()
      .notNullable()
      .defaultTo(knex.raw('uuid_generate_v4()'));
    table.integer('user_id').notNullable();
    table.foreign('user_id').references('users.user_id');
    table
      .timestamp('created_at')
      .notNullable()
      .defaultTo(knex.raw('now()'));
    table
      .timestamp('updated_at')
      .notNullable()
      .defaultTo(knex.raw('now()'));
  });

  return Promise.all([createUsersTable, createPasswordsTable, createSessionsTable]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('sessions'),
    knex.schema.dropTable('passwords'),
    knex.schema.dropTable('users'),
  ]);
};