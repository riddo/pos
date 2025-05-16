import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Role from '#models/role'
import mail from '@adonisjs/mail/services/main'
import db from '@adonisjs/lucid/services/db'
import { EmployeeService } from '#services/employee_service'

export default class EmployeesController {
  async index({ inertia }: HttpContext) {
    const employees = await User.query()
      .apply((scopes) => scopes.active())
      .preload('role')
    const roles = await Role.all()

    return inertia.render('settings/employees/index', {
      employees,
      roles,
    })
  }

  async store({ request, response, session }: HttpContext) {
    const trx = await db.transaction()

    try {
      const data = request.only(['fullName', 'email', 'roleId'])
      const employeeService = new EmployeeService()
      await employeeService.register(data, trx)
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

  async update({ params, request, response, session }: HttpContext) {
    const trx = await db.transaction()

    try {
      const data = request.only(['fullName', 'email', 'roleId'])

      const employeeService = new EmployeeService()
      await employeeService.update(data, params.id, trx)

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

  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.softDelete()
    return response.redirect().back()
  }
}
