export class CopyFlowService {
    originalFlow: any;
    originalMatches: any[] = []
    copiedFlow: any;
    copiedMatches: any[] = []

    constructor(originalFlow: any, originalMatches: any[] = []) {
        this.originalFlow = originalFlow;
        this.originalMatches = originalMatches;
    }

    process(){
        this.copiedFlow = this.copyFlowData();
        this.copiedMatches = this.copyMatchData();

        // Here you would typically call an API to create the new flow
        // For demonstration, we will just log the copied flow and matches
        console.log("Copied Flow:", this.copiedFlow);
        console.log("Copied Matches:", this.copiedMatches);
        return {flow: this.copiedFlow, matches: this.copiedMatches};
    }    

    copyFlowData() {
        return {
            ...this.originalFlow,
            id: crypto.randomUUID(), // Remove ID to create as new
            name: `${this.originalFlow.name} (Copy)`,
            parent_flow_id: this.originalFlow.id, // Point to original
        };
    }

    copyMatchData() {
        return this.originalMatches.map((match: any) => ({
            ...match,
            flow_match_id: crypto.randomUUID(), // New IDs for matches
            flow_id: undefined, // Will be set by backend
        }));
    }
}
