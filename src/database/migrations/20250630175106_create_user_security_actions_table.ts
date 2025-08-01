import type { Knex } from 'knex';

const tableName = 'user_security_actions';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.hasTable(tableName).then(function (exists) {
    if (!exists) {
      return knex.schema.createTable(tableName, function (table) {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());

        table.uuid('user_id').notNullable();

        table.string('type').notNullable();

        table.jsonb('payload').nullable();

        table.string('secret').notNullable().unique();

        table.string('status').notNullable().defaultTo('PENDING');

        table.timestamp('expired_at').notNullable();

        // Timestamps
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();

        table
          .foreign('user_id')
          .references('id')
          .inTable('users')
          .onDelete('RESTRICT');
      });
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(tableName);
}
