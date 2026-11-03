// 조회에 실패하면 마지막으로 성공한 결과를 돌려주고, 결과가 없을 때만 오류를 전달한다
export function withLastGood<T>(
  loader: () => Promise<T>,
  onFallback: (error: unknown) => void
): () => Promise<T> {
  let lastGood: { value: T } | null = null

  return async () => {
    try {
      const value = await loader()
      lastGood = { value }
      return value
    } catch (error) {
      if (!lastGood) throw error
      onFallback(error)
      return lastGood.value
    }
  }
}
