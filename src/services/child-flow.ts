export class ChildFlowService {
    originalFlow: any;
    originalMatch: any
    childFlow: any;
    childMatches: any[] = []

    constructor(originalFlow: any, originalMatch: any) {
        this.originalFlow = originalFlow;
        this.originalMatch = originalMatch;
    }

    process(){
        this.childFlow = this.copyFlowData();
        this.childMatches = this.copyMatchData();

        console.log("Child Flow:", this.childFlow);
        console.log("Child Matches:", this.childMatches);
        return {flow: this.childFlow, matches: this.childMatches};
    }    

    copyFlowData() {
        return {
            ...this.originalFlow,
            id: crypto.randomUUID(), // Remove ID to create as new
            name: `${this.originalFlow.name} (Child)`,
            parent_flow_id: this.originalFlow.id, // Point to original
            parent_flow_match_id: this.originalMatch?.flow_match_id, // Link to first match
        };
    }

    copyMatchData() {
        return [{
            ...this.originalMatch,
            flow_match_id: crypto.randomUUID(), // New IDs for matches
            flow_id: undefined, // Will be set by backend
        }];
    }
}
