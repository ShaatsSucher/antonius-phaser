export default class ArrayUtils {
  public static range(min: number, max?: number) {
    if (!max) {
      max = min - 1
      min = 0
    }
    let counter = min
    return Array.apply(null, { length: max - min + 1 }).map(() => counter++)
  }
}
