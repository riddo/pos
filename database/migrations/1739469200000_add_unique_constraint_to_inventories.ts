import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventories'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Agregar restricción única compuesta para product_id y warehouse_id
      table.unique(['product_id', 'warehouse_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Eliminar la restricción única
      table.dropUnique(['product_id', 'warehouse_id'])
    })
  }
} 