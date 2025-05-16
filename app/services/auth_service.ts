import User from '#models/user'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

// Interfaces para seguir el Principio de Segregación de Interfaces
interface LoginCredentials {
  email: string
  password: string
}

// Servicio que sigue el Principio de Responsabilidad Única
export class AuthService {
  private auth: any

  public setAuth(auth: any): void {
    this.auth = auth
  }

  // Método público que orquesta el proceso de login
  public async login(credentials: LoginCredentials, trx: TransactionClientContract): Promise<User> {
    if (!this.auth) {
      throw new Error('Auth no inicializado')
    }

    const user = await this.validateCredentials(credentials)
    await this.updateLastLogin(user, trx)
    await this.auth.use('web').login(user)

    return user
  }

  // Métodos privados que siguen el Principio de Responsabilidad Única
  private async validateCredentials(credentials: LoginCredentials): Promise<User> {
    const user = await User.findBy('email', credentials.email)
    if (!user) {
      throw new Error('Credenciales incorrectas')
    }

    const isValidPassword = await hash.verify(user.password, credentials.password)
    if (!isValidPassword) {
      throw new Error('Credenciales incorrectas')
    }

    return user
  }

  private async updateLastLogin(user: User, trx: TransactionClientContract): Promise<void> {
    user.lastLoginAt = DateTime.now()
    await user.useTransaction(trx).save()
  }
}
