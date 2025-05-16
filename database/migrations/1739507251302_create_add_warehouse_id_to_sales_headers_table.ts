import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales_header'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('warehouse_id').unsigned().references('id').inTable('warehouses').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('warehouse_id')
    })
  }
} 