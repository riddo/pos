import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import SalesHeader from './sales_header.js'
import Product from './product.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class SalesDetail extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare salesHeaderId: number

  @column()
  declare productId: number

  @column()
  declare quantity: number

  @column()
  declare unitPrice: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => SalesHeader)
  declare salesHeader: BelongsTo<typeof SalesHeader>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}
