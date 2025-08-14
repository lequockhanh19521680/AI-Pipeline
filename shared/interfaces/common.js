// Common application interfaces
// Enums
export var PipelineStage;
(function (PipelineStage) {
    PipelineStage["REQUIREMENTS"] = "Business Analyst";
    PipelineStage["ARCHITECTURE"] = "AI Architect";
    PipelineStage["DESIGN"] = "AI UX/UI Designer";
    PipelineStage["DEVELOPMENT"] = "AI Developer";
    PipelineStage["QA"] = "AI QA Engineer";
    PipelineStage["REFINEMENT"] = "AI Developer (Refinement)";
    PipelineStage["DEPLOYMENT"] = "AI DevOps Engineer";
})(PipelineStage || (PipelineStage = {}));
export var PipelineStatus;
(function (PipelineStatus) {
    PipelineStatus["IDLE"] = "idle";
    PipelineStatus["RUNNING"] = "running";
    PipelineStatus["COMPLETED"] = "completed";
    PipelineStatus["ERROR"] = "error";
})(PipelineStatus || (PipelineStatus = {}));
//# sourceMappingURL=common.js.map