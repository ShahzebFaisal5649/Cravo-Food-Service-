import mongoose from 'mongoose'

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    cuisine: { type: String, required: true },
    isOpen: { type: Boolean, default: true },
    image: { type: String },
    description: { type: String },
    address: { type: String },
    rating: { type: Number, default: 0 },
    deliveryTime: { type: String },
    minOrder: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
  },
  {
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

export default mongoose.model('Restaurant', restaurantSchema)