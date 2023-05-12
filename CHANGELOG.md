# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- Development environment information
- Package instructions
- Add instructions in README where people can find signed extension (see [issue 22](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/issues/22))
- Mention the minimum version of CSS that is needed (see [issue 23](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/issues/23))
- Domain filter (with optional regex syntax) (see [issue 24](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/issues/24))
- Show error message when logging in failed (see [issue 25](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/issues/25))
- Add form validation (see [issue 35](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/issues/35))

### Changed
- Update development instructions
- Only authenticate requests that return 401 unauthorized (see [issue 10](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/issues/10))

### Fixed
- Fix a bug that caused the popup to still show login options and throw an error after already being logged in
- Fix a bug that caused the status of the enable regex button te be out of sync after login when reopening the popup
- Fix a bug that caused the status of the enable regex button to not be 'off' by default after logout
- Fix a bug that causes log in to always fail with correct credentials until extension is reloaded (see [issue 42](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/issues/42))
- Fix a bug that causes the logout button to not always appear after logging in until reopening the extension.

## 1.0.0 - 2023-03-17

- First version!