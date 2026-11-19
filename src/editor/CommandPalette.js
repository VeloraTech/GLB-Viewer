/** CommandPalette — state-aware keyboard command search for the editor. */
const normalize = (value) => String(value || "").trim().toUpperCase().replace(/\\s+/g, " ");

export class CommandPalette {
  constructor({ root = document, input, overlay, registry, onExecute = () => {} }) {
    if (!input || !overlay || !registry) throw new TypeError("CommandPalette requires input, overlay and registry.");
    this.root=root; this.input=input; this.overlay=overlay; this.registry=registry; this.onExecute=onExecute;
    this.query=""; this.activeIndex=0; this.opened=false; this.commands=new Map(); this.runningGroups=new Set();
    this.onKeyDown=(event)=>this.handleKeyDown(event);
    this.onInput=()=>{this.query=this.input.value;this.activeIndex=0;this.render();};
    this.onClick=(event)=>{const item=event.target.closest("[data-command-id]");if(item)this.execute(item.dataset.commandId);};
    this.root.addEventListener("keydown",this.onKeyDown,true);
    this.input.addEventListener("input",this.onInput);
    this.overlay.addEventListener("click",this.onClick);
  }
  register(command) {
    if(!command||!/^[a-z0-9][a-z0-9-]*$/i.test(command.id||"")||typeof command.execute!=="function") throw new TypeError("A command requires a valid id and execute function.");
    if(this.commands.has(command.id)) throw new Error(`Command "${command.id}" is already registered.`);
    const entry={label:command.id.toUpperCase(),description:"",aliases:[],keywords:[],enabled:()=>true,disabledReason:()=>"Unavailable",...command};
    this.commands.set(entry.id,entry);this.refresh();return()=>{this.commands.delete(entry.id);this.refresh();};
  }
  state(command) {
    let enabled=false,reason="";
    try { enabled=Boolean(command.enabled()); if(!enabled) reason=typeof command.disabledReason==="function"?command.disabledReason():command.disabledReason||"Currently unavailable"; }
    catch(error){reason=error?.message||"Availability check failed";}
    if(command.exclusiveGroup&&this.runningGroups.has(command.exclusiveGroup)){enabled=false;reason="Another "+command.exclusiveGroup+" operation is running";}
    return {enabled,reason};
  }
  list(query=this.query) {
    const q=normalize(query),tokens=q.split(" ").filter(Boolean);
    return [...this.commands.values()].map(command=>{
      const candidates=[command.label,command.id,...command.aliases,...command.keywords].map(normalize);
      let score=0;
      if(!q)score=1;else if(candidates.some(v=>v===q))score=100;else if(candidates.some(v=>v.startsWith(q)))score=80;else if(tokens.every(t=>candidates.some(v=>v.includes(t))))score=50;else return null;
      return {id:command.id,command,score,...this.state(command)};
    }).filter(Boolean).sort((a,b)=>b.score-a.score||a.command.label.localeCompare(b.command.label));
  }
  refresh(){if(this.opened)this.render();}
  open(initial=""){this.opened=true;this.query=initial;this.activeIndex=0;this.overlay.hidden=false;this.input.value=initial;this.render();this.input.focus();this.input.setSelectionRange(this.input.value.length,this.input.value.length);}
  close(){this.opened=false;this.overlay.hidden=true;this.input.value="";this.query="";}
  handleKeyDown(event){
    const target=event.target,isEditable=target?.matches?.("input, textarea, select, [contenteditable='true']")||target?.isContentEditable;
    if(this.opened){
      if(event.key==="Escape"){event.preventDefault();event.stopPropagation();this.close();return;}
      const items=this.list(),available=items.map((item,index)=>item.enabled?index:-1).filter(index=>index>=0);
      if(event.key==="ArrowDown"||event.key==="ArrowUp"){event.preventDefault();if(available.length){const current=available.indexOf(this.activeIndex),step=event.key==="ArrowDown"?1:-1;this.activeIndex=available[(current+step+available.length)%available.length];}this.render();return;}
      if(event.key==="Tab"){const selected=items[this.activeIndex];if(selected?.enabled){event.preventDefault();this.input.value=selected.command.label;this.query=selected.command.label;this.activeIndex=0;this.render();}return;}
      if(event.key==="Enter"){event.preventDefault();event.stopPropagation();const selected=items[this.activeIndex];if(selected?.enabled)this.execute(selected.command.id);return;}
      return;
    }
    if(isEditable||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.key==="F3"||(event.key===" "&&event.shiftKey)){event.preventDefault();this.open();return;}
    if(event.key.length===1&&!event.repeat){event.preventDefault();this.open(event.key);}
  }
  async execute(id){
    const command=this.commands.get(id);if(!command)return false;
    const status=this.state(command);if(!status.enabled)return false;
    this.close();
    const group=command.exclusiveGroup;if(group)this.runningGroups.add(group);
    this.refresh();
    try{const result=await command.execute();this.onExecute(command);return result===undefined?true:result;}
    catch(error){this.onExecute(command,error);throw error;}
    finally{if(group)this.runningGroups.delete(group);this.refresh();}
  }
  render(){
    const items=this.list(),list=this.overlay.querySelector("[data-command-results]");list.replaceChildren();
    if(!items.length){const empty=this.root.createElement("div");empty.className="command-empty";empty.textContent="No matching commands";list.append(empty);return;}
    if(this.activeIndex>=items.length||!items[this.activeIndex]?.enabled)this.activeIndex=Math.max(0,items.findIndex(item=>item.enabled));
    items.forEach(({command,enabled,reason},index)=>{
      const button=this.root.createElement("button");button.type="button";button.className="command-result"+(enabled?"":" is-disabled");
      button.dataset.commandId=command.id;button.disabled=!enabled;button.setAttribute("aria-disabled",String(!enabled));button.setAttribute("aria-selected",String(index===this.activeIndex));
      const title=this.root.createElement("span");title.textContent=command.label;
      const description=this.root.createElement("small");description.textContent=enabled?command.description:(reason||command.description);
      button.append(title,description);list.append(button);
    });
  }
  dispose(){this.root.removeEventListener("keydown",this.onKeyDown,true);this.input.removeEventListener("input",this.onInput);this.overlay.removeEventListener("click",this.onClick);this.close();this.commands.clear();this.runningGroups.clear();}
}
