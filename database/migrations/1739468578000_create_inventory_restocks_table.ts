import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_restocks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('supplier_id').unsigned().notNullable().references('id').inTable('suppliers')
      table.integer('warehouse_id').unsigned().notNullable().references('id').inTable('warehouses')
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products')
      table.integer('quantity').notNullable()
      table.integer('user_id').unsigned().nullable().references('id').inTable('users')
      table.timestamp('restock_date')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}