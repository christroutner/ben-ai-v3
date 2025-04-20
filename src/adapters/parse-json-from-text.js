
const jsonBlockPattern = /```json\n([\s\S]*?)\n```/

class ParseJsonAdapter {
  constructor () {
    // Bind 'this' object to all methods.
    this.parseJSONObjectFromText = this.parseJSONObjectFromText.bind(this)
    this.normalizeJsonString = this.normalizeJsonString.bind(this)
  }

  /**
   * Parses a JSON object from a given text. The function looks for a JSON block wrapped in triple backticks
   * with `json` language identifier, and if not found, it searches for an object pattern within the text.
   * It then attempts to parse the JSON string into a JavaScript object. If parsing is successful and the result
   * is an object (but not an array), it returns the object; otherwise, it tries to parse an array if the result
   * is an array, or returns null if parsing is unsuccessful or the result is neither an object nor an array.
   *
   * @param text - The input text from which to extract and parse the JSON object.
   * @returns An object parsed from the JSON string if successful; otherwise, null or the result of parsing an array.
   */
  parseJSONObjectFromText (text) {
    let jsonData = null
    const jsonBlockMatch = text.match(jsonBlockPattern)

    try {
      if (jsonBlockMatch) {
        // Parse the JSON from inside the code block
        jsonData = JSON.parse(this.normalizeJsonString(jsonBlockMatch[1].trim()))
      } else {
        // Try to parse the text directly if it's not in a code block
        jsonData = JSON.parse(this.normalizeJsonString(text.trim()))
      }
    } catch (_e) {
      console.log('Could not parse text as JSON, returning null')
      return null
    }

    // Ensure we have a non-null object that's not an array
    if (jsonData && typeof jsonData === 'object' && !Array.isArray(jsonData)) {
      return jsonData
    }

    console.log('Could not parse text as JSON, returning null')

    return null
  }

  /**
   * Normalizes a JSON-like string by correcting formatting issues:
   * - Removes extra spaces after '{' and before '}'.
   * - Wraps unquoted values in double quotes.
   * - Converts single-quoted values to double-quoted.
   * - Ensures consistency in key-value formatting.
   * - Normalizes mixed adjacent quote pairs.
   *
   * This is useful for cleaning up improperly formatted JSON strings
   * before parsing them into valid JSON.
   *
   * @param str - The JSON-like string to normalize.
   * @returns A properly formatted JSON string.
   */
  normalizeJsonString (str) {
    // Remove extra spaces after '{' and before '}'
    str = str.replace(/\{\s+/, '{').replace(/\s+\}/, '}').trim()

    // "key": unquotedValue → "key": "unquotedValue"
    str = str.replace(/("[\w\d_-]+")\s*: \s*(?!"|\[)([\s\S]+?)(?=(,\s*"|\}$))/g, '$1: "$2"')

    // "key": 'value' → "key": "value"
    str = str.replace(/"([^"]+)"\s*:\s*'([^']*)'/g, (_, key, value) => `"${key}": "${value}"`)

    // "key": someWord → "key": "someWord"
    str = str.replace(/("[\w\d_-]+")\s*:\s*([A-Za-z_]+)(?!["\w])/g, '$1: "$2"')

    // Replace adjacent quote pairs with a single double quote
    str = str.replace(/(?:"')|(?:'")/g, '"')
    return str
  };
}

export default ParseJsonAdapter
