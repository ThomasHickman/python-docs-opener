#!/bin/bash
import sys
import jedi
import json
import traceback

# In Python, sys.stdout becomes block buffered when it thinks it's not interactive. Running the
# process though nodejs makes it think that it's not interactive, so we have to force a flush.
def stdout_write(message: str):
    print(message, flush=True)

def stderr_write(message: str):
    print(message, flush=True, file=sys.stderr)

# TODO: get rid of this as I don't know whether this is exposed as a public API
from jedi.api.classes import Name

def get_function_at_position(file: str, line: int, column: int) -> str:
    script = jedi.Script(path=file)

    # NOTE: Jedi columns are 0 indexed, but we're using 1 indexed columns (because that makes more sense)
    infered_function_names = script.infer(line=line, column=column - 1)
    if len(infered_function_names) == 0:
        return None

    assert len(infered_function_names) == 1, f"{infered_function_names} = infered_function_names"
    infered_function_name: Name = infered_function_names[0]

    assert infered_function_name.full_name is not None

    return infered_function_name.full_name

def entrypoint():
    for input_str in sys.stdin:
        try:
            input_json = json.loads(input_str)
            line = input_json["line"]
            column = input_json["column"]
            file = input_json["file"]

            stdout_write(json.dumps(get_function_at_position(file, line, column)))
        except Exception:
            stderr_write(f"Input failed to be computed. Exception: ")
            stderr_write(traceback.format_exc())

            stdout_write("null")


# test: {"line": 22, "column": 15, "file": "/home/thomas/Documents/python-help-fetcher/my/test-folder/test.py"}
# test: {"line": 1, "column": 1, "file": "/home/thomas/Documents/python-help-fetcher/my/test-folder/test.py"}

if __name__ == "__main__":
    entrypoint()