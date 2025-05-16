import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('address').nullable()
      table.string('phone').nullable()
      table.string('city').nullable()
      table.string('state').nullable()
      table.string('country').nullable()
      table.dateTime('last_login_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('address')
      table.dropColumn('phone')
      table.dropColumn('city')
      table.dropColumn('state')
      table.dropColumn('country')
      table.dropColumn('last_login_at')
    })
  }
}
