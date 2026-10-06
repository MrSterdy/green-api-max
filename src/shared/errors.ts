export function errorText(error: unknown): string {
  return error instanceof TypeError
    ? 'Не удалось связаться с GREEN-API. Проверьте сеть, адрес API и доступность CORS.'
    : error instanceof Error
      ? error.message
      : 'Не удалось выполнить запрос. Попробуйте снова.'
}
