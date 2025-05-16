import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_adjustments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Primero eliminamos la restricción existente
      this.raw('ALTER TABLE inventory_adjustments DROP CONSTRAINT IF EXISTS inventory_adjustments_adjustment_type_check')
      
      // Añadimos la nueva restricción con los tipos adicionales
      this.raw(`
        ALTER TABLE inventory_adjustments 
        ADD CONSTRAINT inventory_adjustments_adjustment_type_check 
        CHECK (adjustment_type IN ('damage', 'loss', 'correction', 'theft', 'shrinkage'))
      `)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Revertimos a los tipos originales
      this.raw('ALTER TABLE inventory_adjustments DROP CONSTRAINT IF EXISTS inventory_adjustments_adjustment_type_check')
      this.raw(`
        ALTER TABLE inventory_adjustments 
        ADD CONSTRAINT inventory_adjustments_adjustment_type_check 
        CHECK (adjustment_type IN ('damage', 'loss', 'correction'))
      `)
    })
  }
}