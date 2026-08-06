import express from 'express'
import { protect } from '../middleware/auth.js'
import { getMyFavorites, addFavorite, removeFavorite } from '../features/favorites/favorites.controller.js'

const router = express.Router()

router.use(protect) // favorites are always user-scoped — no anonymous access

router.get('/', getMyFavorites)
router.post('/:restaurantId', addFavorite)
router.delete('/:restaurantId', removeFavorite)

export default router