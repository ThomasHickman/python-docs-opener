#!/bin/bash
import sys
from typing import Optional
import jedi
import json
import traceback

from jedi.api.classes import Name

# In Python, sys.stdout becomes block buffered when it thinks it's not interactive. Running the
# process though nodejs makes it think that it's not interactive, so we have to force a flush.
def stdout_write(message: str):
    print(message, flush=True)

def stderr_write(message: str):
    print(message, flush=True, file=sys.stderr)

def get_function_at_position(file: str, line: int, column: int, python_executable: Optional[str], file_text: Optional[str]) -> str:
    if python_executable:
        environment = jedi.create_environment(python_executable)
        script = jedi.Script(path=file, code=file_text, environment=environment)
    else:
        script = jedi.Script(path=file, code=file_text)
    
    # NOTE: Jedi columns are 0 indexed, but we're using 1 indexed columns (because that makes more
    # sense generally)
    infered_function_names = script.goto(line=line, column=column - 1)
    if len(infered_function_names) == 0:
        return None

    # Just take the first entry (if there's multiple entries here, hope the first one might provide some use)
    infered_function_name: Name = infered_function_names[0]

    if infered_function_name.full_name is None:
        if infered_function_name.name.startswith("__"):
            return f"__import_system__.{infered_function_name.name}"
        else:
            return None

    return infered_function_name.full_name


def entrypoint():
    for input_str in sys.stdin:
        try:
            input_json = json.loads(input_str)
            file = input_json["file"]
            fileText = input_json.get("fileText")
            line = input_json["line"]
            column = input_json["column"]
            python_executable = input_json.get("pythonExecutable")

            stdout_write(json.dumps(get_function_at_position(
                file=file,
                file_text=fileText,
                line=line,
                column=column,
                python_executable=python_executable
            )))
        except Exception:
            stderr_write(traceback.format_exc())

            stdout_write("null")

if __name__ == "__main__":
    entrypoint()