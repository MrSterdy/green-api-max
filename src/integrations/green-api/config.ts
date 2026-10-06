export function readApiUrl(
  value = import.meta.env.VITE_API_URL || 'https://3100.api.green-api.com',
): string {
  let url: URL
  try {
    url = new URL(value.trim())
  }
  catch {
    throw new Error('Укажите в VITE_API_URL адрес API из кабинета GREEN-API, начиная с https://.')
  }
  if (
    url.protocol !== 'https:'
    || !/\.green-?api\.com$/.test(url.hostname)
    || url.username
    || url.password
    || url.port
    || !/^\/(?:v3\/?)?$/.test(url.pathname)
    || url.search
    || url.hash
  ) {
    throw new Error(
      'Используйте HTTPS-адрес API на домене green-api.com или greenapi.com из кабинета.',
    )
  }
  return url.href.replace(/\/$/, '')
}
