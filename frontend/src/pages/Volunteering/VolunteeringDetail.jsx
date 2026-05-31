import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import posthog from "../../posthog";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../components/Button/BackButton";
import { DeleteButton } from "../../components/Button/DeleteButton";
import { DuplicateButton } from "../../components/Button/DuplicateButton";
import { EditButton } from "../../components/Button/EditButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailBlock, { Row, Value } from "../../components/Detail/DetailBlock";
import DetailCard from "../../components/Detail/DetailCard";
import FormFieldSelectAjax from "../../components/Form/FormFieldSelectAjax";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import ShareMenu from "../../components/ShareMenu";
import { useDeleteVolunteering, useDuplicateVolunteering } from "../../hooks/crudResourceHooks";
import pb from "../../pb";
import {
  createVolunteeringAttendance,
  deleteVolunteeringAttendance,
  getVolunteeringAttendance,
  getVolunteeringJob,
} from "../../services/volunteeringService";
import { formatDateTime } from "../../utils/dateTimeUtils";

const AttendanceToggle = ({ attending, onToggle, disabled }) => (
  <div className="flex flex-col md:flex-row items-center gap-3 w-full justify-center">
    {!attending ? (
      <button
        onClick={onToggle}
        disabled={disabled}
        className="w-full md:w-auto px-6 py-3 rounded-xl font-semibold transition-all bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-900/20 active:scale-95 disabled:opacity-50"
      >
        Ik kom helpen!
      </button>
    ) : (
      <button
        onClick={onToggle}
        disabled={disabled}
        className="w-full md:w-auto px-6 py-3 rounded-xl font-semibold transition-all bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white border border-red-600/20 active:scale-95 disabled:opacity-50"
      >
        Ik kan toch niet
      </button>
    )}
  </div>
);

const AttendanceList = ({ attendanceList, userId, onAddUser, onDeleteAttendance, isVolunteerAdmin }) => {
  const [addUserForm, setAddUserForm] = useState({ user: "" });
  const [pickerKey, setPickerKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Aanmeldingen</h3>
        <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
          {attendanceList.length} aanmeldingen
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {attendanceList.map((att) => (
          <div
            key={att.id}
            className={`flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 ${
              att.user === userId ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shrink-0">
                {att.expand?.user?.name?.charAt(0) || att.expand?.user?.username?.charAt(0) || "?"}
              </div>
              <span className="font-medium text-[var(--text-primary)] truncate">
                {att.expand?.user?.name || att.expand?.user?.username}
              </span>
            </div>
            {(att.user === userId || isVolunteerAdmin) && (
              <button
                onClick={() => onDeleteAttendance(att.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {attendanceList.length === 0 && (
          <div className="col-span-full py-8 text-center text-[var(--text-secondary)] italic">
            Nog geen aanmeldingen...
          </div>
        )}
      </div>

      {isVolunteerAdmin && (
        <div className="pt-4 border-t border-black/10 dark:border-white/10">
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
            Gebruiker toevoegen
          </p>
          <div className="max-w-sm">
            <FormFieldSelectAjax
              key={pickerKey}
              name="user"
              collection="users"
              optionDisplay="name"
              searchFields={["name", "username"]}
              placeholder="Zoek een gebruiker..."
              formData={addUserForm}
              setFormData={(newFormData) => {
                if (newFormData.user) {
                  onAddUser(newFormData.user);
                  setPickerKey((k) => k + 1);
                }
                setAddUserForm({ user: "" });
              }}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const VolunteeringDetail = ({ isVolunteerAdmin }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const duplicateMutation = useDuplicateVolunteering();
  const deleteMutation = useDeleteVolunteering();

  const [volunteering, setVolunteering] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = pb.authStore.record?.id;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [job, attendance] = await Promise.all([getVolunteeringJob(id), getVolunteeringAttendance(id)]);
        setVolunteering(job);
        setAttendanceList(attendance);
      } catch (err) {
        if (!err?.isAbort) setError(err?.message || "Vrijwilligerswerk niet gevonden.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const attending = useMemo(() => {
    return attendanceList.some((att) => att.user === userId);
  }, [attendanceList, userId]);

  const handleToggleAttendance = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (attending) {
        const attendance = attendanceList.find((att) => att.user === userId);
        if (attendance) {
          await deleteVolunteeringAttendance(attendance.id);
          posthog.capture("volunteering cancelled", {
            volunteering_id: id,
            volunteering_name: volunteering?.name,
          });
        }
      } else {
        await createVolunteeringAttendance(id, userId);
        posthog.capture("volunteering signed up", {
          volunteering_id: id,
          volunteering_name: volunteering?.name,
        });
      }
      const newAttendanceList = await getVolunteeringAttendance(id);
      setAttendanceList(newAttendanceList);
    } catch (err) {
      console.error("Error toggling attendance:", err);
      posthog.captureException(err);
      alert("Er is een fout opgetreden bij het aanmelden.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (user_id) => {
    try {
      await createVolunteeringAttendance(id, user_id);
      const newAttendanceList = await getVolunteeringAttendance(id);
      setAttendanceList(newAttendanceList);
    } catch (err) {
      console.error("Error adding user:", err);
      alert("Er is een fout opgetreden.");
    }
  };

  const handleDeleteAttendance = async (attendance_id) => {
    try {
      await deleteVolunteeringAttendance(attendance_id);
      const newAttendanceList = await getVolunteeringAttendance(id);
      setAttendanceList(newAttendanceList);
    } catch (err) {
      console.error("Error deleting attendance:", err);
      alert("Er is een fout opgetreden.");
    }
  };

  const handleDuplicate = async () => {
    if (window.confirm("Weet je zeker dat je dit vrijwilligerswerk wilt dupliceren?")) {
      try {
        const result = await duplicateMutation.mutateAsync(id);
        navigate(`/volunteering/${result.id}`);
      } catch (err) {
        console.error("Error duplicating:", err);
        alert("Dupliceren mislukt.");
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Weet je zeker dat je dit vrijwilligerswerk wilt verwijderen?")) {
      try {
        await deleteMutation.mutateAsync(id);
        navigate("/volunteering");
      } catch (err) {
        console.error("Error deleting:", err);
        alert("Verwijderen mislukt.");
      }
    }
  };

  if (loading && !volunteering) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={error} />;
  if (!volunteering) return null;

  return (
    <PageContent>
      <PageHeader
        title={volunteering.name}
        backButton={<BackButton onClick={() => navigate(`/volunteering?${searchParams.toString()}`)} />}
      >
        <ShareMenu
          title={volunteering.name}
          text={`Help je mee met ${volunteering.name} op ${formatDateTime(volunteering.date_time)}?`}
          url={window.location.href}
        />
        {isVolunteerAdmin && (
          <>
            <DuplicateButton onClick={handleDuplicate} showText size="normal" />
            <EditButton
              onClick={() => navigate(`/volunteering/${id}/edit?${searchParams.toString()}`)}
              showText
              size="normal"
              ariaLabel="Vrijwilligerswerk bewerken"
            />
            <DeleteButton onClick={handleDelete} showText size="normal" ariaLabel="Vrijwilligerswerk verwijderen" />
          </>
        )}
      </PageHeader>

      <div className="space-y-4">
        <DetailCard title="Details">
          <DetailBlock>
            <Row>
              <span className="font-medium text-[var(--text-secondary)]">Datum</span>
              <Value>{formatDateTime(volunteering.date_time)}</Value>
            </Row>
            {volunteering.description && (
              <Row>
                <span className="font-medium text-[var(--text-secondary)]">Beschrijving</span>
                <Value>{volunteering.description}</Value>
              </Row>
            )}
            <Row>
              <span className="font-medium text-[var(--text-secondary)]">Totaal aantal gevraagd</span>
              <Value className="text-blue-600 dark:text-blue-400 font-bold">{volunteering.number_needed}</Value>
            </Row>
            <Row>
              <span className="font-medium text-[var(--text-secondary)]">Nog nodig</span>
              <Value className="text-blue-600 dark:text-blue-400 font-bold">{volunteering.still_needed}</Value>
            </Row>
          </DetailBlock>
        </DetailCard>

        <DetailCard>
          <AttendanceToggle attending={attending} onToggle={handleToggleAttendance} disabled={loading} />
        </DetailCard>

        <DetailCard>
          <AttendanceList
            attendanceList={attendanceList}
            userId={userId}
            onAddUser={handleAddUser}
            onDeleteAttendance={handleDeleteAttendance}
            isVolunteerAdmin={isVolunteerAdmin}
          />
        </DetailCard>
      </div>
    </PageContent>
  );
};

export default VolunteeringDetail;
