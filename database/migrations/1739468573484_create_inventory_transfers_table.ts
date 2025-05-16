import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_transfers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products')
      table.integer('from_warehouse_id').unsigned().notNullable().references('id').inTable('warehouses')
      table.integer('to_warehouse_id').unsigned().notNullable().references('id').inTable('warehouses')
      table.integer('quantity').notNullable()
      table.integer('user_id').unsigned().nullable().references('id').inTable('users')
      table.enum('status', ['pending', 'completed', 'canceled']).defaultTo('pending')
      table.timestamp('transfer_date')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}