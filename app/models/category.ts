import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, beforeSave } from '@adonisjs/lucid/orm'
import User from '#models/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Category extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare categoryName: string

  @column()
  declare userId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relación con User
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @beforeSave()
  static async formatCategoryName(category: Category) {
    if (category.categoryName) {
      const words = category.categoryName.toLowerCase().split(' ')
      category.categoryName = words
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
