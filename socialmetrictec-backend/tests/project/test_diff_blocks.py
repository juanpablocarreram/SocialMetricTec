import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from services.crud.project import _diff_blocks


def test_no_changes_returns_empty():
    blocks = [{'id': '1', 'type': 'hero', 'props': {'title': 'Hola'}}]
    assert _diff_blocks(blocks, blocks) == []


def test_block_added_by_id():
    old = [{'id': '1', 'type': 'hero', 'props': {}}]
    new = [{'id': '1', 'type': 'hero', 'props': {}}, {'id': '2', 'type': 'text', 'props': {}}]
    result = _diff_blocks(old, new)
    assert ('page_block_added', 'Text') in result
    assert len(result) == 1


def test_block_removed_by_id():
    old = [{'id': '1', 'type': 'hero', 'props': {}}, {'id': '2', 'type': 'image', 'props': {}}]
    new = [{'id': '1', 'type': 'hero', 'props': {}}]
    result = _diff_blocks(old, new)
    assert ('page_block_removed', 'Image') in result
    assert len(result) == 1


def test_block_modified_by_id():
    old = [{'id': '1', 'type': 'hero', 'props': {'title': 'Antes'}}]
    new = [{'id': '1', 'type': 'hero', 'props': {'title': 'Después'}}]
    result = _diff_blocks(old, new)
    assert ('page_block_modified', 'Hero') in result
    assert len(result) == 1


def test_multiple_changes():
    old = [
        {'id': '1', 'type': 'hero', 'props': {'title': 'Antes'}},
        {'id': '2', 'type': 'image', 'props': {}},
    ]
    new = [
        {'id': '1', 'type': 'hero', 'props': {'title': 'Después'}},
        {'id': '3', 'type': 'text', 'props': {}},
    ]
    result = _diff_blocks(old, new)
    assert ('page_block_modified', 'Hero') in result
    assert ('page_block_removed', 'Image') in result
    assert ('page_block_added', 'Text') in result
    assert len(result) == 3


def test_blocks_without_id_fallback_to_position():
    old = [{'type': 'hero', 'props': {'title': 'A'}}]
    new = [{'type': 'hero', 'props': {'title': 'B'}}]
    result = _diff_blocks(old, new)
    assert ('page_block_modified', 'Hero') in result
    assert len(result) == 1


def test_no_id_block_added_by_position():
    old = []
    new = [{'type': 'video', 'props': {}}]
    result = _diff_blocks(old, new)
    assert ('page_block_added', 'Video') in result


def test_type_fallback_when_missing():
    old = [{'id': '1', 'props': {}}]
    new = [{'id': '1', 'props': {'x': 1}}]
    result = _diff_blocks(old, new)
    assert ('page_block_modified', 'Bloque') in result


def test_empty_to_empty_returns_empty():
    assert _diff_blocks([], []) == []
