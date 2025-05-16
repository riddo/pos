import type { HttpContext } from '@adonisjs/core/http'
import Role from '#models/role'
import Permission from '#models/permission'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'

export default class RolesController {
  async index({ inertia, session }: HttpContext) {
    const roles = await Role.query().preload('permissions')
    const permissions = await Permission.all()

    return inertia.render('settings/roles/index', {
      roles,
      permissions,
      flash: {
        success: session.flashMessages.get('success'),
        errors: session.flashMessages.get('errors'),
      },
    })
  }

  async store({ request, response, session }: HttpContext) {
    const trx = await db.transaction()
    try {
      const data = request.only(['rol', 'permissions'])
      const rol = await Role.query().where('rol', data.rol).first()
      if (rol) {
        throw new Error('El rol ya existe')
      }
      const role = await Role.create({ rol: data.rol })
      await role.related('permissions').attach(data.permissions)
      await trx.commit()
      return response.redirect().back()
    } catch (error) {
      await trx.rollback()
      session.flash('errors', {
        message: error.message,
      })
      return response.redirect().back()
    }
  }

  async update({ request, params, response }: HttpContext) {
    const role = await Role.findOrFail(params.id)
    const data = request.only(['rol', 'permissions'])

    await role.merge({ rol: data.rol }).save()
    await role.related('permissions').sync(data.permissions)

    return response.redirect().back()
  }

  async destroy({ params, response, session }: HttpContext) {
    try {
      const role = await Role.findOrFail(params.id)
      const user = await User.query()
        .apply((scopes) => scopes.active())
        .select('id')
        .where('roleId', params.id)
      if (user.length > 0)
        throw new Error('Se debe reasignar a los empleados con este rol antes de eliminarlos')
      if (role.rol !== 'admin') {
        await role.delete()
      }
      return response.redirect().back()
    } catch (error) {
      console.log(error.message)
      session.flash('errors', {
        message: error.message,
      })
      return response.redirect().back()
    }
  }

  async create({ inertia }: HttpContext) {
    const permissions = await Permission.all()

    return inertia.render('settings/roles/Create', {
      permissions,
    })
  }
}
