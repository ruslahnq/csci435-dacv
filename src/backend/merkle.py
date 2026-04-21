from __future__ import annotations

from functools import lru_cache

import poseidon


DEGREE_ENCODING = {
    "Bachelor of Science": 1,
    "Bachelor of Arts": 2,
    "Master of Science": 3,
    "Master of Arts": 4,
    "Doctor of Philosophy": 5,
    "Associate Degree": 6,
}

GRADUATE_DEGREE_SET = [3, 4, 5]


@lru_cache(maxsize=1)
def _poseidon_pair_hasher():
    return poseidon.Poseidon(poseidon.parameters.prime_255, 128, 5, 2, 3)


def poseidon_pair(left: int, right: int) -> int:
    hasher = _poseidon_pair_hasher()
    return int(hasher.run_hash([int(left), int(right)]))


def build_degree_tree(degrees: list[int]) -> dict:
    if len(degrees) > 8:
        raise ValueError("Degree tree supports at most 8 leaves")

    leaves = [int(value) for value in degrees]
    while len(leaves) < 8:
        leaves.append(0)

    levels = [leaves]
    current_level = leaves
    for _ in range(3):
        next_level = []
        for index in range(0, len(current_level), 2):
            next_level.append(
                poseidon_pair(current_level[index], current_level[index + 1])
            )
        levels.append(next_level)
        current_level = next_level

    index_by_value = {}
    for index, value in enumerate(leaves):
        index_by_value.setdefault(value, index)

    return {
        "depth": 3,
        "leaves": leaves,
        "levels": levels,
        "root": levels[-1][0],
        "indexByValue": index_by_value,
    }


def get_merkle_proof(degree_int: int, tree: dict) -> dict:
    leaves = tree["leaves"]
    try:
        index = leaves.index(int(degree_int))
    except ValueError as exc:
        raise ValueError("Degree is not present in the tree") from exc

    path_elements = []
    path_indices = []
    current_index = index

    for level in range(tree["depth"]):
        sibling_index = current_index ^ 1
        path_elements.append(tree["levels"][level][sibling_index])
        path_indices.append(current_index % 2)
        current_index //= 2

    return {
        "pathElements": path_elements,
        "pathIndices": path_indices,
        "root": tree["root"],
    }


DEGREE_TREE = build_degree_tree(GRADUATE_DEGREE_SET)
