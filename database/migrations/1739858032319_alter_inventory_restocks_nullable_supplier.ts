import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_restocks'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Modificar la columna supplier_id para permitir null
      table.integer('supplier_id').unsigned().nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Revertir el cambio
      table.integer('supplier_id').unsigned().notNullable().alter()
    })
  }
} 