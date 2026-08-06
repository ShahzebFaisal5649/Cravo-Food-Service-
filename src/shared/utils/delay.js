export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function randomDelay() {
  return delay(300 + Math.random() * 300)
}