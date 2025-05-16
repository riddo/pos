import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, scope } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Inventory from './inventory.js'

export default class Warehouse extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare location: string | null

  @column()
  declare warehouseType: 'store' | 'warehouse'

  @column()
  declare status: 'active' | 'inactive'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ serializeAs: null })
  declare deletedAt: DateTime | null

  // Scope para obtener solo usuarios activos
  static active = scope((query) => {
    query.whereNull('deleted_at')
  })

  // Método para soft delete
  async softDelete() {
    this.deletedAt = DateTime.now()
    await this.save()
  }

  @hasMany(() => Inventory)
  declare inventories: HasMany<typeof Inventory>
}
