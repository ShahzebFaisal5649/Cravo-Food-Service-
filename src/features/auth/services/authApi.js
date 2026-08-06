// cravo/src/features/auth/services/authApi.js
import axiosInstance from '../../../shared/services/axiosInstance'

export async function signup({ name, email, password }) {
  try {
    const { data } = await axiosInstance.post('/auth/signup', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    })
    return data
  } catch (error) {
    // If the email is already taken (typically 409 Conflict)
    if (error.response && error.response.status === 409) {
      throw new Error('An account with this email already exists.', { cause: error })
    }
    throw error
  }
}

export async function login({ email, password }) {
  try {
    const { data } = await axiosInstance.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    })
    return data
  } catch (error) {
    if (error.response) {
      // If no user account is found (404 Not Found)
      if (error.response.status === 404) {
        throw new Error('No account found with this email.', { cause: error })
      }
      // If the password doesn't match (401 Unauthorized)
      if (error.response.status === 401) {
        throw new Error('Incorrect password.', { cause: error })
      }
    }
    throw error
  }
}