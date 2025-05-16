import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, afterCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Warehouse from './warehouse.js'
import InventoryMovement from './inventory_movement.js'

export default class InventoryAdjustment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare productId: number

  @column()
  declare warehouseId: number

  @column()
  declare quantity: number

  @column()
  declare adjustmentType: 'damage' | 'loss' | 'correction' | 'theft' | 'shrinkage'

  @column()
  declare reason: string | null

  @column()
  declare userId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Warehouse)
  declare warehouse: BelongsTo<typeof Warehouse>

  @afterCreate()
  public static async createMovementRecord(adjustment: InventoryAdjustment) {
    await InventoryMovement.create({
      productId: adjustment.productId,
      warehouseId: adjustment.warehouseId,
      movementType: 'adjustment',
      quantity: adjustment.quantity,
      reason: adjustment.reason,
      userId: adjustment.userId,
      salesHeaderId: null,
      createdAt: adjustment.createdAt,
      updatedAt: adjustment.updatedAt
    })
  }
}