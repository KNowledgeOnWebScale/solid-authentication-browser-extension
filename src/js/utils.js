/**
 * This function returns the value for the requested header.
 * @param requestHeaders - The array with headers.
 * @param headerName - The name of the header.
 * @returns {*|null} - The value of the header or null if the header is not found.
 */
export function findHeader(requestHeaders, headerName) {
  if (!requestHeaders) {
    return null;
  }

  let i = 0;

  while(i < requestHeaders.length && requestHeaders[i].name !== headerName) {
    i ++;
  }

  if (i < requestHeaders.length) {
    return requestHeaders[i].value;
  }

  return null;
}
