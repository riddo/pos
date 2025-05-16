import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, belongsTo, scope } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Role from '#models/role'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare roleId: number

  @column()
  declare address: string | null

  @column()
  declare phone: string | null

  @column()
  declare city: string | null

  @column()
  declare state: string | null

  @column()
  declare country: string | null

  @column.dateTime()
  declare lastLoginAt: DateTime | null

  @column()
  declare profileImage: string | null

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

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
}
