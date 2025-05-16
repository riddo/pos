import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_adjustments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products')
      table.integer('warehouse_id').unsigned().notNullable().references('id').inTable('warehouses')
      table.enum('adjustment_type', [
        'damage',    // daño
        'loss',      // pérdida
        'correction', // corrección
        'theft',     // robo
        'shrinkage'  // merma
      ]).notNullable()
      table.integer('quantity').notNullable()
      table.string('reason').nullable()
      table.integer('user_id').unsigned().nullable().references('id').inTable('users')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}