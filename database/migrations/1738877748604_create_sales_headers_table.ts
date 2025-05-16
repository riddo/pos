import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales_header'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id') // Primary key
      table
        .integer('user_id') // Relationship with users table
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE') // Cascade delete if user is removed
        .notNullable()
      table
        .integer('payment_method_id') // Relationship with payment_methods table
        .unsigned()
        .references('id')
        .inTable('payment_methods')
        .onDelete('SET NULL') // Set to NULL if payment method is removed
        .nullable()
      table.decimal('total', 12, 2).notNullable() // Total sale amount
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now()) // Creation date
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now()) // Update date
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName) // Drops the table
  }
}
