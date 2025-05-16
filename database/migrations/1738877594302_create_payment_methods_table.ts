import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payment_methods'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id') // Primary key
      table.string('method_type', 100).notNullable() // Type of payment method
      table.text('details').nullable() // Additional details about the payment method
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now()) // Creation date
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now()) // Update date
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName) // Drops the table
  }
}
