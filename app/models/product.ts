import { DateTime } from 'luxon'
import {
  BaseModel,
  belongsTo,
  column,
  hasMany,
  scope,
  beforeSave,
} from '@adonisjs/lucid/orm'
import User from '#models/user'
import Category from '#models/category'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Inventory from '#models/inventory'
import SalesDetail from '#models/sales_detail'
import Unit from '#models/unit'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare categoryId: number | null

  @column()
  declare unitId: number | null

  @column()
  declare productName: string

  @column()
  declare price: number

  @column()
  declare imagePath: string | null

  @column()
  declare description: string | null

  @column()
  declare sku: string | null

  @column()
  declare hasInventory: boolean

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

  // Relación con User
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  // Relación con Category
  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @belongsTo(() => Unit)
  declare unit: BelongsTo<typeof Unit>

  @hasMany(() => Inventory)
  declare inventory: HasMany<typeof Inventory>

  @hasMany(() => SalesDetail)
  declare salesDetails: HasMany<typeof SalesDetail>

  @beforeSave()
  static async formatProductName(product: Product) {
    if (product.productName) {
      const words = product.productName.toLowerCase().split(' ')
      product.productName = words
        .map((word, index) => {
          // Solo capitalizar la primera palabra
          if (index === 0) {
            return word.charAt(0).toUpperCase() + word.slice(1)
          }
          return word
        })
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
    }
  }
}
