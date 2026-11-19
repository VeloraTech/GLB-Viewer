import test from 'node:test';
import assert from 'node:assert/strict';
import { CommandPalette } from '../src/editor/CommandPalette.js';

test('CommandPalette ranks prefix matches and executes selected commands', () => {
  const listeners = new Map();
  const makeElement = () => ({
    hidden: true, value: '', children: [], dataset: {},
    addEventListener(type, fn) { (this.listeners ||= new Map()).set(type, fn); },
    removeEventListener() {},
    querySelector() { return this.list ||= { replaceChildren() { this.children = []; }, append(item) { this.children.push(item); } }; },
    append(...items) { this.children.push(...items); },
    replaceChildren() { this.children = []; },
    setAttribute() {}, focus() {}, setSelectionRange() {}
  });
  const root = { activeElement: null, addEventListener(type, fn) { listeners.set(type, fn); }, removeEventListener() {}, createElement: makeElement };
  const input = makeElement(), overlay = makeElement();
  const palette = new CommandPalette({ root, input, overlay, registry: {} });
  let opened = 0;
  palette.register({ id: 'light', label: 'LIGHT', execute: () => opened++ });
  palette.register({ id: 'lighting-reset', label: 'LIGHTING RESET', execute: () => opened += 10 });
  assert.equal(palette.list('LIG')[0].id, 'light');
  assert.equal(palette.execute('light'), true);
  assert.equal(opened, 1);
  palette.dispose();
});

test('CommandPalette ignores editable fields and rejects duplicate commands', () => {
  const root = { addEventListener() {}, removeEventListener() {}, createElement: () => ({}) };
  const input = { addEventListener() {}, removeEventListener() {} };
  const overlay = { addEventListener() {}, removeEventListener() {}, hidden: true, querySelector: () => ({ replaceChildren() {} }) };
  const palette = new CommandPalette({ root, input, overlay, registry: {} });
  palette.register({ id: 'light', execute() {} });
  assert.throws(() => palette.register({ id: 'light', execute() {} }), /already registered/);
  palette.dispose();
});
