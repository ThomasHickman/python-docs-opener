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

## Development
### Running tests

To run the tests, first create a virtual environment with `jedi~=0.18` installed it it:
```
$ virtualenv venv
created virtual environment CPython3.12.5.final.0-64 in 116ms
  creator CPython3Posix(dest=/home/user/python-docs-opener/venv, clear=False, no_vcs_ignore=False, global=False)
  seeder FromAppData(download=False, pip=bundle, via=copy, app_data_dir=/home/user/.local/share/virtualenv)
    added seed packages: pip==24.0
  activators BashActivator,CShellActivator,FishActivator,NushellActivator,PowerShellActivator,PythonActivator
$ pip install jedi~=0.18
Collecting jedi~=0.18
  Using cached jedi-0.19.1-py2.py3-none-any.whl.metadata (22 kB)
Collecting parso<0.9.0,>=0.8.3 (from jedi~=0.18)
  Using cached parso-0.8.4-py2.py3-none-any.whl.metadata (7.7 kB)
Using cached jedi-0.19.1-py2.py3-none-any.whl (1.6 MB)
Using cached parso-0.8.4-py2.py3-none-any.whl (103 kB)
Installing collected packages: parso, jedi
Successfully installed jedi-0.19.1 parso-0.8.4
```
Then run `npm test`