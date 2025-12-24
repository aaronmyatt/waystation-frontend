import m from "mithril";

class FlowListService {
  _flows = []
  
  get flows(){
    return this._flows;  
  }
  
  load(flows){
   this._flows = flows;
   m.redraw()
  }
}
globalThis.flowListService = new FlowListService();
export {
  FlowListService
};