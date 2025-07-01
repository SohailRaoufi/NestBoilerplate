import type { Knex } from 'knex';

const tableName = 'attachments';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.hasTable(tableName).then(function (exists) {
    if (!exists) {
      return knex.schema.createTable(tableName, function (table) {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());

        table.string('url').notNullable();
        table.string('thumbnail_url').nullable();

        table.timestamp('deleted_at').nullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      });
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(tableName);
}
