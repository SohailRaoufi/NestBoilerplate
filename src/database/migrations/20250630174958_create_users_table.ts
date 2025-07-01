import type { Knex } from 'knex';

const tableName = 'users';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.hasTable(tableName).then(function (exists) {
    if (!exists) {
      return knex.schema.createTable(tableName, function (table) {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());

        table.string('name').nullable();
        table.string('email').notNullable().unique();
        table.string('password_hash').notNullable();
        table.string('role').notNullable();
        table.string('phone').notNullable();


        table.boolean('notification_enabled').notNullable().defaultTo(true);

        table.timestamp('email_verified_at').nullable();

        table
          .boolean('two_factor_authentication_enabled')
          .notNullable()
          .defaultTo(false);
        table.string('two_factor_authentication_secret').nullable();


        table.
          uuid('avatar_id').
          nullable().
          references('id').
          inTable('attachments').
          onDelete('SET NULL');

        table.string('oauth_provider').nullable();
        table.string('oauth_provider_id').nullable();

        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('deactivated_at').nullable();
        table.timestamp('deleted_at').nullable();
      });
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(tableName);
}
