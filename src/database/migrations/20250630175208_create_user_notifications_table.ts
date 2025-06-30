import type { Knex } from 'knex';

const tableName = 'user_notifications';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.hasTable(tableName).then(function (exists) {
    if (!exists) {
      return knex.schema.createTable(tableName, function (table) {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());

        table.uuid('user_id').notNullable();

        table.string('title').notNullable();
        table.text('content').nullable();
        table.jsonb('metadata').nullable();
        table.string('type').notNullable();
        table.string('topic').nullable();
        table.timestamp('read_at').nullable();

        // Timestamps
        table.timestamp('deleted_at').nullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

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
