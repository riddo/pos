import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Role from '#models/role'

export default class Permission extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare permissionsName: string

  @column()
  declare description: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Role, {
    pivotTable: 'roles_permissions',
    localKey: 'id',
    pivotForeignKey: 'permisos_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'roles_id',
  })
  declare roles: ManyToMany<typeof Role>
}
