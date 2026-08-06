import mongoose from 'mongoose'

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    description: { type: String },
    variants: [
      {
        name: { type: String, required: true },
        priceModifier: { type: Number, default: 0 },
      },
    ],
  },  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

export default mongoose.model('MenuItem', menuItemSchema)