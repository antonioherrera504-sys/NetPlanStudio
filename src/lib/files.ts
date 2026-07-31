export const downloadText = (filename: string, content: string, type = 'application/json') => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = filename; anchor.click()
  URL.revokeObjectURL(url)
}

export const escapeCsv = (value: unknown) => {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value)
  else {
    const area = document.createElement('textarea'); area.value = value; area.style.position = 'fixed'; area.style.opacity = '0'; document.body.append(area); area.select(); document.execCommand('copy'); area.remove()
  }
}

