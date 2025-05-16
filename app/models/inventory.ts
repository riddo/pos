import { BaseModel, beforeSave, belongsTo, column } from '@adonisjs/lucid/orm'
import Product from './product.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Warehouse from './warehouse.js'

export default class Inventory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare productId: number

  @column()
  declare warehouseId: number

  @column()
  declare stock: number

  @column()
  declare stockStatus: 'available' | 'low' | 'out_of_stock'

  @column()
  declare criticalStock: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => Warehouse)
  declare warehouse: BelongsTo<typeof Warehouse>

  @beforeSave()
  public static async updateStockStatus(inventory: Inventory) {
    if (inventory.$dirty.stock !== undefined) {
      if (inventory.stock <= 0) {
        inventory.stockStatus = 'out_of_stock'
      } else if (inventory.stock <= inventory.criticalStock) {
        inventory.stockStatus = 'low'
      } else {
        inventory.stockStatus = 'available'
      }
    }
  }
}
