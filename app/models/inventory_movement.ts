import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Warehouse from './warehouse.js'
import SalesHeader from './sales_header.js'
import Product from './product.js'
import User from './user.js'

export default class InventoryMovement extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare productId: number

  @column()
  declare warehouseId: number

  @column()
  declare movementType: 'restock' | 'sale' | 'adjustment' | 'transfer_in' | 'transfer_out'

  @column()
  declare quantity: number

  @column()
  declare reason: string | null

  @column()
  declare userId: number | null

  @column()
  declare salesHeaderId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Warehouse)
  declare warehouse: BelongsTo<typeof Warehouse>

  @belongsTo(() => SalesHeader)
  declare salesHeader: BelongsTo<typeof SalesHeader>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}