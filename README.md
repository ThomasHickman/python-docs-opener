# python-docs-opener

VS code extension to open documentation for the current symbol under the cursor in the default web browser.

![Screen recording of python-docs-opener in action](static/screen-recording.gif)

## Requirements

- python >= 3.6
- [virtualenv](https://virtualenv.pypa.io/en/latest/installation.html)

## Commands

To open the current open documentation for the current symbol under the cursor in the web browser, either press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> and search for `Python Docs Opener`, or use the keyboard shortcut <kbd>Shift</kbd> + <kbd>F1</kbd>.

## Opening documentation from non-builtin Python libraries

You can use the setting `additionalLibraryToDocsMappings` to specify documentation for third party libraries. The variable `${symbol_name}` can be used to specify the symbol. For example, to specify the documentation for pytest, add the following setting:

```javascript
"pythonDocsOpener.additionalLibraryToDocsMappings": {
    "pytest": "https://docs.pytest.org/en/6.2.x/reference.html#${symbol_name}"
}
```
