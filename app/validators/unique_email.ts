import vine from '@vinejs/vine'
import User from '#models/user'

/**
 * Regla personalizada para verificar si un email ya está en uso.
 */
export const uniqueEmail = vine.createRule(async (value, _, options) => {
  if (typeof value !== 'string') {
    return // Si el valor no es un string, no hacemos nada (otros validadores se encargan de esto)
  }
  console.log(value)
  // Buscar si el email ya está registrado
  const user = await User.findBy('email', value)
  if (user) {
    options.report('El email ya está en uso', 'uniqueEmail', options)
  }
})
