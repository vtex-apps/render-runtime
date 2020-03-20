export let uncriticalPromise: Promise<void> | undefined

export const handleUncriticalLoad = () => {
  if (document.querySelector('styles#critical')) {
    uncriticalPromise = new Promise(resolve => {
      window.addEventListener('load', () => {
        const base = document.querySelector('noscript#styles_base')
        if (base) {
          base.insertAdjacentHTML('afterend', base.innerHTML)
        }

        const overrides = document.querySelector('noscript#styles_overrides')
        if (overrides) {
          overrides.insertAdjacentHTML('afterend', overrides.innerHTML)
        }

        resolve()
      })
    })
  }
}
