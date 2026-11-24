import { useParentChild } from "../../context/ParentChildContext";
import SchedulePage from "../shared/SchedulePage";

function ParentSchedule() {
    const {selectedChild} = useParentChild()
  return (
    <SchedulePage showChildSwitcher={true} classId={selectedChild?.classId} nurseryId={selectedChild?.nurseryId}/>
  );
}

export default ParentSchedule;