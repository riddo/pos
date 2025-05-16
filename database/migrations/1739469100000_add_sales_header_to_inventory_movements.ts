import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_movements'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('sales_header_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('sales_header')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('sales_header_id')
    })
  }
} 