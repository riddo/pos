import vine from '@vinejs/vine'
import { uniqueEmail } from '#validators/unique_email'

export const registerValidator = vine.compile(
  vine.object({
    fullName: vine.string().maxLength(100),
    email: vine.string().email().normalizeEmail().use(uniqueEmail()), // ✅ Aplicamos la regla aquí
    password: vine
      .string()
      .minLength(8)
      .regex(/(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*.])/), // Al menos una mayúscula, un número y un carácter especial
    roleId: vine.number(), // Agregar validación para roleId
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string(),
  })
)
