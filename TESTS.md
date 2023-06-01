## Test if request is unauthenticated when logged-out
### Preconditions
 - Extension is logged-out.
 - Webpage that requires authentication.
 - User has access to webpage when logged-in.

### Steps
1. Load webpage.

### Postconditions
- The request returns a 403 status code.

## Test extension's UI when logged-out
### Preconditions
- Extension is logged-out.

### Steps
1. Open the extension by clicking the icon in the toolbar.

### Postconditions
- All input fields are empty, except for placeholders.
- Regex button is toggled off.
- Only one button is present which reads "Log in".

## Test extension's UI when logged-in
### Preconditions
- Extension is logged-in.

### Steps
1. Open the extension by clicking the icon in the toolbar.

### Postconditions
- Extension icon in browser top menu bar has an added green checkmark.
- The popup shows
  - green label says "You are now logged-in."
  - domain filter and regex status that match those entered on login or last domain filter update.
  - two buttons that read "Update" and "Log out".

## Test extension's UI when logging out after successful log-in
### Preconditions
- Extension is logged-in.

### Steps
1. Open the extension by clicking the icon in the toolbar.
2. Press the button that reads "Log out".

### Postconditions
- Green log in label disappears
- Buttons that read "Log out" and "Update" disappear. 
They are switched out for a button that reads "Log in".
- Email, password and IDP form fields appear that are empty except for placeholders.
- Domain filter field is cleared and regex button is toggled to default "off" state.

## Test domain filter with match (no regex)
### Preconditions
- Extension logged-in using a domain filter without regex syntax.
- Webpage that requires authentication and that matches the domain filter.
- User has access to webpage when logged-in.

### Steps
1. Load webpage.

### Postconditions
- The request is authenticated and returns a 200 status code.

## Test domain filter without match (no regex)
### Preconditions
- Extension is logged-in using a domain filter without regex syntax.
- Webpage that requires authentication and that does not match the domain filter.
- User has access to webpage when logged-in.

### Steps
1. Load webpage.

### Postconditions
- The request is not authenticated and returns a 401 status code.

## Test domain filter with match (regex)
### Preconditions
- Extension is logged-in using a domain filter with regex syntax.
- Webpage that requires authentication and that matches the domain filter.
- User has access to webpage when logged-in.

### Steps
1. Load webpage.

### Postconditions
- The request is authenticated and returns a 200 status code.

## Test domain filter without match (regex)
### Preconditions
- Extension is logged-in using a domain filter with regex syntax.
- Webpage that requires authentication and that does not match the domain filter.
- User has access to webpage when logged-in.

### Steps
1. Load webpage.

### Postconditions
- The request is not authenticated and returns a 401 status code.

## Test domain filter update after login
###  Preconditions
- Extension is logged-in using a domain filter or not.

### Steps
1. Change the domain filter and/or regex button state.
2. Press the button that reads "Update".

### Postconditions
- Behavior of extension changes as expected of the newly updated domain filter 
(according to the aforementioned domain filter tests).

## Test browser storage
### Preconditions
- Extension is logged-in.

### Steps
1. Reload browser extension (or restart the browser when using a signed version of the extension).

### Postconditions
- Extension is still logged-in.
- Authentication still works on websites that require authentication.
that matches the credentials used when logging in before reloading the extension.
- Domain filter and regex button state matches those used when logging in or last updated before reloading the extension.





