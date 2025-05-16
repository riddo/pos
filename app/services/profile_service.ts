import User from '#models/user'
import Role from '#models/role'
import hash from '@adonisjs/core/services/hash'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { promises as fs } from 'node:fs'

// Interfaces para seguir el Principio de Segregación de Interfaces
interface ProfileUpdateData {
  address: string
  phone: string
  fullName: string
}

interface PasswordChangeData {
  currentPassword: string
  password: string
  passwordConfirmation: string
}

interface ProfileData {
  user: User
  role: string
}

// Servicio que sigue el Principio de Responsabilidad Única
export class ProfileService {
  private auth: any

  public setAuth(auth: any): void {
    this.auth = auth
  }

  private async getAuthenticatedUser(): Promise<User> {
    if (!this.auth) {
      throw new Error('Auth no inicializado')
    }
    return await this.auth.authenticate()
  }

  private async getUserRole(user: User): Promise<string> {
    const role = await Role.findOrFail(user.roleId)
    return role.rol
  }

  public async getProfileData(): Promise<ProfileData> {
    const user = await this.getAuthenticatedUser()
    const role = await this.getUserRole(user)

    return {
      user,
      role,
    }
  }

  private async updateUserProfile(
    user: User,
    data: ProfileUpdateData,
    trx: TransactionClientContract
  ): Promise<void> {
    user.merge({
      address: data.address,
      phone: data.phone,
      fullName: data.fullName,
    })
    await user.useTransaction(trx).save()
  }

  public async updateProfile(
    data: ProfileUpdateData,
    trx: TransactionClientContract
  ): Promise<User> {
    const user = await this.getAuthenticatedUser()
    await this.updateUserProfile(user, data, trx)
    return user
  }

  private async verifyCurrentPassword(user: User, currentPassword: string): Promise<void> {
    const isValidPassword = await hash.verify(user.password, currentPassword)
    if (!isValidPassword) {
      throw new Error('La contraseña actual es incorrecta')
    }
  }

  private verifyPasswordMatch(password: string, passwordConfirmation: string): void {
    if (password !== passwordConfirmation) {
      throw new Error('Las contraseñas no coinciden')
    }
  }

  private async updateUserPassword(
    user: User,
    password: string,
    trx: TransactionClientContract
  ): Promise<void> {
    user.merge({ password })
    await user.useTransaction(trx).save()
  }

  public async changePassword(
    data: PasswordChangeData,
    trx: TransactionClientContract
  ): Promise<void> {
    const user = await this.getAuthenticatedUser()

    await this.verifyCurrentPassword(user, data.currentPassword)
    this.verifyPasswordMatch(data.password, data.passwordConfirmation)
    await this.updateUserPassword(user, data.password, trx)
  }

  private async processProfileImage(image: MultipartFile): Promise<string> {
    if (!image.isValid) {
      throw new Error('Imagen inválida')
    }

    const imageName = `profile_${new Date().getTime()}.${image.extname}`
    await image.move('inertia/public/profiles', { name: imageName })
    return imageName
  }

  private async deleteProfileImage(imagePath: string): Promise<void> {
    try {
      if (imagePath !== 'default-avatar.png') {
        await fs.unlink(`inertia/public/profiles/${imagePath}`)
      }
    } catch (error) {
      // Ignorar errores al eliminar el archivo
    }
  }

  public async updateProfileImage(
    image: MultipartFile,
    trx: TransactionClientContract
  ): Promise<void> {
    const user = await this.getAuthenticatedUser()
    let imagePath = 'default-avatar.png'

    try {
      if (image) {
        imagePath = await this.processProfileImage(image)

        // Si el usuario ya tenía una imagen, la eliminamos
        if (user.profileImage && user.profileImage !== 'default-avatar.png') {
          await this.deleteProfileImage(user.profileImage)
        }
      }

      user.merge({ profileImage: imagePath })
      await user.useTransaction(trx).save()
    } catch (error) {
      // Si hay error, eliminar la imagen nueva si se subió
      if (imagePath !== 'default-avatar.png') {
        await this.deleteProfileImage(imagePath)
      }
      throw error
    }
  }
}
