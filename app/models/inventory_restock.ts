import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, afterCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Supplier from './supplier.js'
import Warehouse from './warehouse.js'
import InventoryMovement from './inventory_movement.js'

export default class InventoryRestock extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare supplierId: number | null

  @column()
  declare warehouseId: number

  @column()
  declare productId: number

  @column()
  declare quantity: number

  @column()
  declare userId: number | null

  @column.dateTime({ autoCreate: true })
  declare restockDate: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Supplier)
  declare supplier: BelongsTo<typeof Supplier>

  @belongsTo(() => Warehouse)
  declare warehouse: BelongsTo<typeof Warehouse>

  @afterCreate()
  public static async createMovementRecord(restock: InventoryRestock) {
    await InventoryMovement.create({
      productId: restock.productId,
      warehouseId: restock.warehouseId,
      movementType: 'restock',
      quantity: restock.quantity,
      reason: null,
      userId: restock.userId,
      salesHeaderId: null,
      createdAt: restock.restockDate,
      updatedAt: restock.restockDate
    })
  }
}