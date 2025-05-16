import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id') // Primary key
      table
        .integer('product_id') // Relationship with products table
        .unsigned()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE') // Cascade delete if product is removed
        .notNullable()
      table.integer('stock').notNullable() // Stock quantity
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now()) // Creation date
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now()) // Update date
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName) // Drops the table
  }
}
