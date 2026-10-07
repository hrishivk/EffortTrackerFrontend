import { useWorkspaceFlow } from "./flow/useWorkspaceFlow";
import { FlowDone, FlowFooter, FlowHeader } from "./flow/FlowParts";
import StepDetails from "./flow/StepDetails";
import StepRooms from "./flow/StepRooms";
import StepAssign from "./flow/StepAssign";
import StepReview from "./flow/StepReview";

export default function WorkspaceFlow() {
  const f = useWorkspaceFlow();

  if (f.done) return <FlowDone f={f} />;

  return (
    <div className="cws">
      <FlowHeader f={f} />

      <div className="cws__main">
        {f.step === 0 && <StepDetails f={f} />}
        {f.step === 1 && <StepRooms f={f} />}
        {f.step === 2 && <StepAssign f={f} />}
        {f.step === 3 && <StepReview f={f} />}
      </div>

      <FlowFooter f={f} />
    </div>
  );
}
