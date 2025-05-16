import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Permission from '#models/permission'

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare rol: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Permission, {
    pivotTable: 'roles_permissions',
    localKey: 'id',
    pivotForeignKey: 'roles_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'permisos_id',
  })
  declare permissions: ManyToMany<typeof Permission>
}
