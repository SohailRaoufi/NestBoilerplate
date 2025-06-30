import type { Knex } from 'knex';

const tableName = 'user_devices';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.hasTable(tableName).then(function (exists) {
    if (!exists) {
      return knex.schema.createTable(tableName, function (table) {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());

        table.uuid('user_id').notNullable();

        table.string('device_id').notNullable();
        table.string('fcm_token').nullable();

        // Timestamps
        table.timestamp('deleted_at').nullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

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
