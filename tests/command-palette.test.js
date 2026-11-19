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

test('unavailable commands remain visible with a reason and cannot execute', async () => {
  const makeElement = () => ({
    hidden:true,value:'',children:[],dataset:{},
    addEventListener(){},removeEventListener(){},
    querySelector(){return this.list ||= {children:[],replaceChildren(){this.children=[];},append(item){this.children.push(item);}};},
    append(...items){this.children.push(...items);},setAttribute(){},focus(){},setSelectionRange(){}
  });
  const root={activeElement:null,addEventListener(){},removeEventListener(){},createElement:makeElement};
  const input=makeElement(),overlay=makeElement();
  const palette=new CommandPalette({root,input,overlay,registry:{}});
  let runs=0;
  palette.register({id:'orbit-preview',label:'ORBIT PREVIEW',execute:()=>runs++,enabled:()=>false,disabledReason:()=>'Already active'});
  const item=palette.list('ORBIT')[0];
  assert.equal(item.enabled,false);
  assert.equal(item.reason,'Already active');
  assert.equal(await palette.execute('orbit-preview'),false);
  assert.equal(runs,0);
  palette.open('ORBIT');
  assert.equal(overlay.querySelector('[data-command-results]').children[0].disabled,true);
  palette.dispose();
});

test('exclusive command groups prevent overlapping operations and release after completion', async () => {
  const root={addEventListener(){},removeEventListener(){},createElement:()=>({})};
  const input={addEventListener(){},removeEventListener(){}};
  const overlay={addEventListener(){},removeEventListener(){},querySelector:()=>({replaceChildren(){}})};
  const palette=new CommandPalette({root,input,overlay,registry:{}});
  let finish, runs=0;
  palette.register({id:'load-a',exclusiveGroup:'file',execute:()=>new Promise(resolve=>{runs++;finish=resolve;})});
  palette.register({id:'load-b',exclusiveGroup:'file',execute:()=>{runs++;}});
  const pending=palette.execute('load-a');
  assert.equal(palette.state(palette.commands.get('load-b')).enabled,false);
  assert.equal(await palette.execute('load-b'),false);
  finish();
  await pending;
  assert.equal(palette.state(palette.commands.get('load-b')).enabled,true);
  assert.equal(runs,1);
  palette.dispose();
});
