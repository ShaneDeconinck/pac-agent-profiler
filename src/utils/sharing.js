export function encodeToHash(state) {
  try {
    const json = JSON.stringify(state)
    return '#' + btoa(encodeURIComponent(json))
  } catch {
    return ''
  }
}

export function decodeFromHash() {
  try {
    const hash = window.location.hash.slice(1)
    if (!hash) return null
    const json = decodeURIComponent(atob(hash))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function exportJSON(state) {
  const date = new Date().toISOString().slice(0, 10)
  const filename = 'pac-agent-profiler-' + date + '.json'
  const json = JSON.stringify(state, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.setAttribute('download', filename)
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

export function importJSON() {
  return new Promise((resolve) => {
    const input = document.getElementById('import-file-input')
    input.value = ''
    input.onchange = () => {
      const file = input.files[0]
      if (!file) return resolve(null)
      const reader = new FileReader()
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result))
        } catch {
          resolve(null)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  })
}
