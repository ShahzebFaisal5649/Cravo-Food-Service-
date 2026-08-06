export async function resetDemoData() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith('cravo-') && key !== 'cravo-theme')
    .forEach((key) => localStorage.removeItem(key))

  window.location.href = '/'
}