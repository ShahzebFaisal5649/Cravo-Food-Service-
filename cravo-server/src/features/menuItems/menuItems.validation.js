import { z } from 'zod'

const variantSchema = z.object({
  name: z.string().trim().min(1, 'Variant name is required'),
  priceModifier: z.number().default(0),
})

export const menuItemSchema = z.object({
  restaurantId: z.string().min(1, 'restaurantId is required'),
  name: z.string().trim().min(1, 'Name is required'),
  category: z.string().trim().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be 0 or more'),
  image: z.string().optional(),
  description: z.string().optional(),
  variants: z.array(variantSchema).optional(),
})

export const menuItemUpdateSchema = menuItemSchema.partial()