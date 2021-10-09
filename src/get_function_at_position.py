#!/bin/bash
import sys
import jedi

# TODO: get rid of this as I don't know whether this is exposed as a public API
from jedi.api.classes import Name

def get_function_at_position(file: str, line: int, column: int):
    script = jedi.Script(path=file)

    # NOTE: Jedi columns are 0 indexed, but we're using 1 indexed columns (because that makes more sense)
    infered_function_names = script.infer(line=line, column=column - 1)

    assert len(infered_function_names) == 1, f"{infered_function_names} = infered_function_names"
    infered_function_name: Name = infered_function_names[0]

    return infered_function_name.full_name

def entrypoint():
    file, line_str, column_str = sys.argv[1:]

    line = int(line_str)
    column = int(column_str)
    print(get_function_at_position(file, line, column))


if __name__ == "__main__":
    entrypoint()