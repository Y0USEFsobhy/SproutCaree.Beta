import { useSelector } from "react-redux";
import SchedulePage from "../shared/SchedulePage";

function TeacherSchedule() {
  let user = useSelector((state) => state.auth.user);
  return (
    <SchedulePage classId={user?.classId} nurseryId={user?.nurseryId}/>
  );
}

export default TeacherSchedule;