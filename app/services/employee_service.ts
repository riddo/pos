import User from '#models/user'
import { TransactionClientContract } from '@adonisjs/lucid/types/database'
import mail from '@adonisjs/mail/services/main'
import EmployeeCreatedEvent from '#events/employee_created'
import emitter from '@adonisjs/core/services/emitter'
import Role from '#models/role'
interface UserRegistrationData {
  fullName: string
  email: string
  roleId: number
}

export class EmployeeService {
  private generateTemporaryPassword(): string {
    return Math.random().toString(36).slice(-8)
  }

  private async sendWelcomeEmail(user: User, temporaryPassword: string) {
    emitter.emit(EmployeeCreatedEvent, {
      data: {
        fullName: user.fullName || '',
        email: user.email,
        temporaryPassword: temporaryPassword,
      },
    })
  }

  private async createUser(
    data: UserRegistrationData,
    temporaryPassword: string,
    trx: TransactionClientContract
  ): Promise<User> {
    return await User.create(
      {
        fullName: data.fullName,
        email: data.email,
        password: temporaryPassword,
        roleId: data.roleId,
      },
      { client: trx }
    )
  }

  private async checkIfAdminRoleIsAllowedToChange(newRoleId: number, user: User): Promise<void> {
    const currentRole = await user.related('role').query().first()
    if (currentRole?.rol === 'admin' && newRoleId !== currentRole.id) {
      throw new Error('No se puede cambiar el rol de un administrador')
    }
  }

  private async checkIfEmployeeExists(email: string): Promise<void> {
    const user = await User.query().where('email', email).first()
    if (user) {
      throw new Error('El correo electrónico ya está en uso')
    }
  }

  public async register(data: UserRegistrationData, trx: TransactionClientContract): Promise<User> {
    await this.checkIfEmployeeExists(data.email)
    const temporaryPassword = this.generateTemporaryPassword()
    const user = await this.createUser(data, temporaryPassword, trx)
    await this.sendWelcomeEmail(user, temporaryPassword)
    return user
  }

  public async update(
    data: UserRegistrationData,
    id: number,
    trx: TransactionClientContract
  ): Promise<User> {
    try {
      const user = await User.findOrFail(id)
      await this.checkIfAdminRoleIsAllowedToChange(data.roleId, user)
      await user.merge(data).save(trx)
      return user
    } catch (error) {
      throw error
    }
  }
}
