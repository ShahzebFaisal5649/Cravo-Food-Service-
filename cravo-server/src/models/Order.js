import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    restaurantName: { type: String },
    items: [
      {
        itemId: String,
        variant: String,
        name: String,
        price: Number,
        quantity: Number,
        notes: String,
      },
    ],
    subtotal: { type: Number },
    deliveryFee: { type: Number },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['placed', 'preparing', 'on the way', 'delivered', 'cancelled'],
      default: 'placed',
    },
    deliveryAddress: { type: String },
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
export default mongoose.model('Order', orderSchema)