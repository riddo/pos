import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventories'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Eliminar la columna address
      table.dropColumn('address')
      
      // Agregar la relación con warehouses
      table
        .integer('warehouse_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('warehouses')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Restaurar la columna address
      table.string('address').nullable()
      
      // Eliminar la columna warehouse_id
      table.dropColumn('warehouse_id')
    })
  }
} 