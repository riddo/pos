import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import SalesHeader from '#models/sales_header'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class PaymentMethod extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare methodType: string

  @column()
  declare details: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => SalesHeader)
  declare salesHeaders: HasMany<typeof SalesHeader>
}
