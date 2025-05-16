import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Role from '#models/role'
import { registerValidator } from '#validators/auth'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class RegistersController {
  async index({ inertia }: HttpContext) {
    const roles = await Role.all()

    return inertia.render('auth/register', {
      roles: roles.map((role) => ({
        id: role.id,
        rol: role.rol,
      })),
    })
  }

  async store({ request, auth, inertia }: HttpContext) {
    const trx = await db.transaction()

    try {
      // ✅ Validar los datos, incluyendo si el email ya existe
      const validatedData = await request.validateUsing(registerValidator)
      const { roleId, ...userData } = validatedData

      // Crear usuario usando la transacción
      const user = await User.create(
        {
          ...userData,
          roleId,
          lastLoginAt: DateTime.now(),
        },
        { client: trx }
      )

      // Realizar login
      await auth.use('web').login(user)

      // Confirmar la transacción
      await trx.commit()

      // Redirigir al dashboard
      return inertia.location('/pos')
    } catch (error) {
      await trx.rollback()

      // Manejar errores de validación
      if (error.messages) {
        return inertia.render('auth/register', {
          errors: error.messages,
          form: request.all(),
        })
      }

      throw error
    }
  }
}
