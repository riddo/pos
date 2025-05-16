import vine from '@vinejs/vine'

export const createProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100),
    price: vine.number().positive(),
    initialStock: vine.number().min(0),
    criticalStock: vine.number().min(0),
    category: vine.number(),
    description: vine.string().optional(),
    sku: vine.string().optional(),
  })
)
