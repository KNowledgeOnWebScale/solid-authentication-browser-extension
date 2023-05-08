## Test if request is unauthenticated when logged out
### Preconditions
 - Extension logged out

### Steps
1. Load a webpage wich requires authentication (that matches the credentials used when logging in).

### Postconditions
- The webpage returns a 403 status code on request.


## Test extension ui when logged out
### Preconditions
- Extension logged out

### Steps
1. Open the extension by clicking the icon in the toolbar.

### Postconditions
- All input fields are empty, except for placeholders.
- Regex button is toggled off.
- Only one button is present which reads 'Log in'

## Test extension ui when logged in
### Preconditions
- Extension logged in

### Steps
1. Open the extension by clicking the icon in the toolbar.

### Postconditions
- Extension icon in browser top menu bar has an added green checkmark
- A green label says 'You are now logged in.'
- Domain filter and regex status matches those entered on login or last domain filter update.
- 2 buttons that read "Update" and "Log out".

## Test extension ui when logging out after succesfull log in
### Preconditions
- Extension logged in

### Steps
1. Open the extension by clicking the icon in the toolbar.
2. Press the button that reads "Log out"

### Postconditions
- Green log in label disappears
- Buttons that read "Log out" and "Update" disappear; they are switched out for a button that reads "Log in".
- Email, password and IDP form field appear that are empty except for placeholders.
- Domain filter field is cleared and regex button is toggled to default 'off' state.

## Test domain filter with match (no regex)
### Preconditions
- Extension logged in (using a domain filter without regex syntax)

### Steps
1. Navigate to a webpage that requires authentication (that matches the credentials used when logging in) and whose url contains domain filter string.

### Postconditions
- The request is authenticated and returns a 200 status code.

## Test domain filter without match (no regex)
### Preconditions
- Extension logged in (using a domain filter without regex syntax).

### Steps
1. Navigate to a webpage that requires authentication (that matches the credentials used when logging in) and whose url doesn't contain the domain filter string.

### Postconditions
- The request is authenticated and returns a 200 status code.

## Test domain filter with match (regex)
### Preconditions
- Extension logged in (using a domain filter with regex syntax).

### Steps
1. Navigate to a webpage that requires authentication (that matches the credentials used when logging in) and whose url fully matches the domain filter's regex syntax.

### Postconditions
- The request is authenticated and returns a 200 status code.

## Test domain filter without match (regex)
### Preconditions
- Extension logged in (using a domain filter with regex syntax).

### Steps
1. Navigate to a webpage that requires authentication (that matches the credentials used when logging in) and whose url doesn't match the domain filter's regex syntax (e.g filter is included in the url but doesn't include every character of the url).

### Postconditions
- The request is not authenticated and returns a 403 status code.

## Test domain filter update after login
###  Preconditions
- Extension logged in (using a domain filter of any kind or none at all).

### Steps
1. Change the domain filter and/or regex button state.
2. Press the button that reads "Update"

### Postconditions
- Behavior of extension changes as expected of the newly updated domain filter (according to the aforementioned domain filter tests).

## Test browser storage
### Preconditions
- Extension logged in

### Steps
1. Reload browser extension (or restart the browser when using a signed version of the extension).

### Postconditions
- Extension is stil: logged in; authentication still works on websites that require authentication that matches the credentials used when logging in before reloading the extension.
- Domain filter and regex button state matches those used when logging in or last updated before reloading the extension.





