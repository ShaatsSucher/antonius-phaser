export default class ArrayUtils {
  public static range(min: number, max?: number) {
    if (!max) {
      max = min - 1
      min = 0
    }
    let counter = min
    return Array.apply(null, { length: max - min + 1 }).map(() => counter++)
  }

  public static removeAt<T>(array: T[], index: number) {
    return array.slice(0, index).concat(array.slice(index + 1))
  }

  public static removeItem<T>(array: T[], item: T) {
    const index = array.indexOf(item)
    return index === -1 ? array : ArrayUtils.removeAt(array, index)
  }
}
