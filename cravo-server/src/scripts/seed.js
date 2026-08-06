import 'dotenv/config'
import mongoose from 'mongoose'
import Restaurant from '../models/Restaurant.js'
import MenuItem from '../models/MenuItem.js'
import User from '../models/User.js'

const restaurantsRaw = [
  { key: 'r1', name: 'Karachi Broast', cuisine: 'Fast Food', rating: 4.3, deliveryTime: '25-35 min', isOpen: true, minOrder: 300, deliveryFee: 60, address: 'Gulberg, Lahore', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400' },
  { key: 'r2', name: 'Pizza Pointt', cuisine: 'Pizza', rating: 4.1, deliveryTime: '30-40 min', isOpen: true, minOrder: 500, deliveryFee: 80, address: 'DHA Phase 5, Lahore', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' },
  { key: 'r3', name: 'Bundu Khan', cuisine: 'BBQ & Desi', rating: 4.5, deliveryTime: '35-45 min', isOpen: true, minOrder: 400, deliveryFee: 70, address: 'Model Town, Lahore', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400' },
  { key: 'r4', name: 'Chaaye Khana', cuisine: 'Desi Cafe', rating: 4.4, deliveryTime: '20-30 min', isOpen: true, minOrder: 250, deliveryFee: 50, address: 'MM Alam Road, Lahore', image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400' },
  { key: 'r5', name: 'Howdy', cuisine: 'Burgers', rating: 4.0, deliveryTime: '25-35 min', isOpen: false, minOrder: 350, deliveryFee: 60, address: 'Johar Town, Lahore', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
  { key: 'r6', name: 'China Town', cuisine: 'Chinese', rating: 4.2, deliveryTime: '30-40 min', isOpen: true, minOrder: 450, deliveryFee: 70, address: 'Liberty Market, Lahore', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400' },
  { key: 'r7', name: 'Tandoori Twist', cuisine: 'BBQ & Desi', rating: 4.6, deliveryTime: '35-50 min', isOpen: true, minOrder: 400, deliveryFee: 70, address: 'Wapda Town, Lahore', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400' },
  { key: 'r8', name: 'Slice Slice Baby', cuisine: 'Pizza', rating: 3.9, deliveryTime: '25-35 min', isOpen: true, minOrder: 500, deliveryFee: 80, address: 'Bahria Town, Lahore', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
  { key: 'r9', name: 'Sweet Affair', cuisine: 'Desserts', rating: 4.7, deliveryTime: '20-30 min', isOpen: true, minOrder: 200, deliveryFee: 50, address: 'Cavalry Ground, Lahore', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400' },
  { key: 'r10', name: 'Roll Xpress', cuisine: 'Fast Food', rating: 3.8, deliveryTime: '20-30 min', isOpen: true, minOrder: 250, deliveryFee: 50, address: 'Garden Town, Lahore', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400' },
  { key: 'r11', name: 'Pasta Villa', cuisine: 'Italian', rating: 4.3, deliveryTime: '35-45 min', isOpen: false, minOrder: 500, deliveryFee: 90, address: 'DHA Phase 6, Lahore', image: 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=400' },
  { key: 'r12', name: 'Karahi Corner', cuisine: 'BBQ & Desi', rating: 4.4, deliveryTime: '40-50 min', isOpen: true, minOrder: 400, deliveryFee: 70, address: 'Faisal Town, Lahore', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400' },
]

const menuRaw = [
  { rKey: 'r1', category: 'Broast & Fried', name: 'Broast Half', price: 550, description: 'Crispy fried chicken, half' },
  { rKey: 'r1', category: 'Broast & Fried', name: 'Broast Full', price: 950, description: 'Crispy fried chicken, full' },
  { rKey: 'r1', category: 'Burgers', name: 'Zinger Burger', price: 350, description: 'Spicy crispy chicken burger' },
  { rKey: 'r1', category: 'Sides', name: 'Fries', price: 200, description: 'Crispy salted fries' },
  { rKey: 'r2', category: 'Pizza', name: 'Fajita Supreme', price: 900, description: 'Chicken fajita, peppers, onions' },
  { rKey: 'r2', category: 'Pizza', name: 'Cheese Lovers', price: 850, description: 'Loaded with mozzarella & cheddar' },
  { rKey: 'r2', category: 'Sides', name: 'Garlic Bread', price: 300, description: 'Toasted garlic bread with cheese' },
  { rKey: 'r2', category: 'Beverages', name: 'Soft Drink 1.5L', price: 150, description: '' },
  { rKey: 'r3', category: 'BBQ', name: 'Chicken Malai Boti', price: 650, description: 'Creamy grilled chicken skewers' },
  { rKey: 'r3', category: 'BBQ', name: 'Seekh Kabab (4pc)', price: 550, description: 'Spiced minced beef skewers' },
  { rKey: 'r3', category: 'Rice & Bread', name: 'Chicken Biryani', price: 400, description: 'Fragrant spiced rice with chicken' },
  { rKey: 'r3', category: 'Rice & Bread', name: 'Naan', price: 40, description: '' },
  { rKey: 'r4', category: 'Chai & Beverages', name: 'Doodh Patti', price: 150, description: 'Traditional milk tea' },
  { rKey: 'r4', category: 'Breakfast', name: 'Halwa Puri', price: 350, description: 'Classic Lahori breakfast' },
  { rKey: 'r4', category: 'Snacks', name: 'Samosa (2pc)', price: 120, description: '' },
  { rKey: 'r5', category: 'Burgers', name: 'Howdy Classic', price: 450, description: 'Beef patty, cheese, special sauce' },
  { rKey: 'r5', category: 'Burgers', name: 'Crispy Chicken Burger', price: 400, description: '' },
  { rKey: 'r5', category: 'Sides', name: 'Onion Rings', price: 250, description: '' },
  { rKey: 'r6', category: 'Rice & Noodles', name: 'Chicken Fried Rice', price: 450, description: '' },
  { rKey: 'r6', category: 'Rice & Noodles', name: 'Chow Mein', price: 480, description: '' },
  { rKey: 'r6', category: 'Mains', name: 'Chicken Manchurian', price: 550, description: '' },
  { rKey: 'r6', category: 'Soups', name: 'Hot & Sour Soup', price: 300, description: '' },
  { rKey: 'r7', category: 'BBQ', name: 'Tandoori Chicken (Half)', price: 500, description: '' },
  { rKey: 'r7', category: 'BBQ', name: 'Beef Chapli Kabab', price: 600, description: '' },
  { rKey: 'r7', category: 'Rice & Bread', name: 'Mutton Pulao', price: 550, description: '' },
  { rKey: 'r8', category: 'Pizza', name: 'Pepperoni Feast', price: 950, description: '' },
  { rKey: 'r8', category: 'Pizza', name: 'Veggie Delight', price: 750, description: '' },
  { rKey: 'r9', category: 'Desserts', name: 'Chocolate Lava Cake', price: 380, description: '' },
  { rKey: 'r9', category: 'Desserts', name: 'Gulab Jamun (6pc)', price: 300, description: '' },
  { rKey: 'r9', category: 'Desserts', name: 'Kunafa Slice', price: 450, description: '' },
  { rKey: 'r10', category: 'Rolls', name: 'Chicken Seekh Roll', price: 280, description: '' },
  { rKey: 'r10', category: 'Rolls', name: 'Beef Bihari Roll', price: 320, description: '' },
  { rKey: 'r11', category: 'Pasta', name: 'Chicken Alfredo', price: 650, description: '' },
  { rKey: 'r11', category: 'Pasta', name: 'Penne Arrabiata', price: 550, description: '' },
  { rKey: 'r11', category: 'Salads', name: 'Caesar Salad', price: 450, description: '' },
  { rKey: 'r12', category: 'Karahi', name: 'Chicken Karahi (Full)', price: 1200, description: '' },
  { rKey: 'r12', category: 'Karahi', name: 'Mutton Karahi (Full)', price: 1800, description: '' },
  { rKey: 'r12', category: 'Rice & Bread', name: 'Roghni Naan', price: 60, description: '' },
]

async function run() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB for seeding...')

  const existing = await Restaurant.countDocuments()
  if (existing > 0) {
    console.log('Restaurants already exist — skipping seed. Delete the collection in Compass first if you want to reseed.')
    await mongoose.disconnect()
    return
  }

  const restaurantIds = {}
  for (const r of restaurantsRaw) {
    const { key, ...data } = r
    const created = await Restaurant.create(data)
    restaurantIds[key] = created._id
  }
  console.log(`Seeded ${restaurantsRaw.length} restaurants`)

  const menuDocs = menuRaw.map((m) => {
    const { rKey, ...data } = m
    return { ...data, restaurantId: restaurantIds[rKey] }
  })
  await MenuItem.insertMany(menuDocs)
  console.log(`Seeded ${menuDocs.length} menu items`)

  const adminExists = await User.findOne({ email: 'admin@cravo.com' })
  if (!adminExists) {
    await User.create({ name: 'Admin', email: 'admin@cravo.com', password: 'admin123', isAdmin: true })
    console.log('Seeded admin user: admin@cravo.com / admin123')
  }

  await mongoose.disconnect()
  console.log('Done.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})