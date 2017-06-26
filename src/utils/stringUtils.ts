export default class StringUtils {
  public static intToString(value: number, digits: number): string {
    let str = `${value}`
    while (str.length < digits) {
      str = `0${str}`
    }
    return str
  }
}
