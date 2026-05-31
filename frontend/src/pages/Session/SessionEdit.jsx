import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import posthog from "../../posthog";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ActionButton } from "../../components/Button";
import { Button } from "../../components/Button/Button";
import { CloseButton } from "../../components/Button/CloseButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailBlock, { Label, Row } from "../../components/Detail/DetailBlock";
import DetailCard from "../../components/Detail/DetailCard";
import Input from "../../components/Form/Input";
import Select from "../../components/Form/Select";
import Textarea from "../../components/Form/Textarea";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import AttendanceByInstrumentGroup from "../../features/sessions/AttendanceByInstrumentGroup";
import AttendanceByRow from "../../features/sessions/AttendanceByRow";
import AttendanceCounters from "../../features/sessions/AttendanceCounters";
import AttendanceTable from "../../features/sessions/AttendanceTable";
import { useCreateSession, useUpdateSession } from "../../hooks/crudResourceHooks";
import pb from "../../pb";
import { sessionSchema } from "../../schemas/sessionSchema";
import { setAttendanceState, setConfirmState } from "../../services/attendanceService";

const ATTENDANCE_STATE_OPTIONS = [
  { value: "will_be_present", label: "Aangemeld" },
  { value: "wont_be_present", label: "Afgemeld" },
];

const SessionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id;
  const [loading, setLoading] = useState(true);
  const [sessionNotFound, setSessionNotFound] = useState(false);
  const [groupOptions, setGroupOptions] = useState([]);
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [updatingAttendance, setUpdatingAttendance] = useState(false);

  const createSessionMutation = useCreateSession();
  const updateSessionMutation = useUpdateSession();

  const form = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: "",
      date_time: "",
      type: "rehearsal",
      groups: [],
      default_attendance_state: "",
      description: "",
      rehearsal_marks: "",
      website_text: "",
      website_report: "",
      website_youtube_id: "",
      threshold_orange: 50,
      threshold_green: 70,
      website_time: "",
    },
  });

  const fetchSessionAndAttendance = async () => {
    setLoading(true);
    try {
      // 1. Fetch groups (resilient)
      try {
        const groups = await pb.collection("mb_groups").getFullList({ sort: "name", requestKey: null });
        setGroupOptions(groups.map((o) => ({ value: o.id, label: o.name })));
      } catch (e) {
        console.error("Error fetching groups:", e);
      }

      if (isCreateMode) {
        setLoading(false);
        return;
      }

      // 2. Fetch session (critical)
      let sessionData = null;
      try {
        sessionData = await pb.collection("mb_sessions").getOne(id, { expand: "groups", requestKey: null });
        if (!sessionData) {
          setSessionNotFound(true);
          setLoading(false);
          return;
        }
        setSession(sessionData);
        form.reset({
          name: sessionData.name || "",
          date_time: sessionData.date_time ? dayjs(sessionData.date_time).format("YYYY-MM-DDTHH:mm") : "",
          type: sessionData.type || "rehearsal",
          groups: sessionData.groups || [],
          default_attendance_state: sessionData.default_attendance_state || "",
          description: sessionData.description || "",
          rehearsal_marks: sessionData.rehearsal_marks || "",
          website_text: sessionData.website_text || "",
          website_report: sessionData.website_report || "",
          website_youtube_id: sessionData.website_youtube_id || "",
          location: sessionData.location || "",
          tickets: sessionData.tickets || "",
          website_tickets_url: sessionData.website_tickets_url || "",
          threshold_orange: sessionData.threshold_orange ?? 50,
          threshold_green: sessionData.threshold_green ?? 70,
          website_time: sessionData.website_time || "",
        });
      } catch (e) {
        console.error("Error fetching session:", e);
        setSessionNotFound(true);
        setLoading(false);
        return;
      }

      // 3. Fetch attendance (resilient)
      try {
        const attendanceData = await pb.collection("mb_attendance").getFullList({
          filter: `session="${id}"`,
          expand: "group_member,group_member.user,group_member.section,session",
          sort: "group_member.section.name",
          requestKey: null,
        });
        setAttendance(attendanceData);
      } catch (e) {
        console.error("Error fetching attendance:", e);
        setAttendance([]);
      }
    } catch (e) {
      console.error("Critical error in fetchSessionAndAttendance:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessionAndAttendance();
  }, [id, isCreateMode]);

  const handleSetState = async (newState) => {
    await setAttendanceState({
      attendance,
      selectedRowKeys,
      newState,
      fetchSessionAndAttendance,
      setSelectedRowKeys,
      setUpdating: setUpdatingAttendance,
    });
  };

  const handleConfirmState = async () => {
    await setConfirmState({
      attendance,
      fetchSessionAndAttendance,
      setSelectedRowKeys,
      setUpdating: setUpdatingAttendance,
    });
  };

  const onSubmit = async (data) => {
    try {
      const sessionData = {
        name: data.name,
        date_time: dayjs(data.date_time).toISOString(),
        type: data.type,
        groups: data.groups,
        default_attendance_state: data.default_attendance_state || "",
        description: data.description || "",
        rehearsal_marks: data.rehearsal_marks || "",
        website_text: data.website_text || "",
        website_report: data.website_report || "",
        website_youtube_id: data.website_youtube_id || "",
        location: data.location || "",
        tickets: data.tickets || "",
        website_tickets_url: data.website_tickets_url || "",
        threshold_orange: data.threshold_orange ?? 50,
        threshold_green: data.threshold_green ?? 70,
        website_time: data.website_time || "",
      };

      let result;
      if (isCreateMode) {
        result = await createSessionMutation.mutateAsync(sessionData);
        posthog.capture("session created", {
          session_id: result.id,
          session_type: sessionData.type,
          session_name: sessionData.name,
        });
        navigate(`/sessions/${result.id}?${searchParams.toString()}`);
      } else {
        await updateSessionMutation.mutateAsync({ id, data: sessionData });
        posthog.capture("session updated", {
          session_id: id,
          session_type: sessionData.type,
          session_name: sessionData.name,
        });
        navigate(`/sessions/${id}?${searchParams.toString()}`);
      }
    } catch (error) {
      console.error("Error saving session:", error);
      posthog.captureException(error);
    }
  };

  if (loading) return <CenteredSpinner />;
  if (sessionNotFound) return <CenteredAlert text="Sessie niet gevonden." />;

  const sessionType = form.watch("type");
  const selectedGroups = form.watch("groups");

  const handleGroupChange = (groupId, checked) => {
    const current = form.getValues("groups");
    form.setValue("groups", checked ? [...current, groupId] : current.filter((id) => id !== groupId), {
      shouldValidate: true,
    });
  };
  const stateCounts = attendance.reduce((acc, record) => {
    acc[record.state] = (acc[record.state] || 0) + 1;
    return acc;
  }, {});

  return (
    <PageContent fullWidth>
      <PageHeader title={session?.name || (isCreateMode ? "Nieuwe sessie" : "Sessie bewerken")} variant="edit">
        <CloseButton
          onClick={() =>
            navigate(
              isCreateMode ? `/sessions?${searchParams.toString()}` : `/sessions/${id}?${searchParams.toString()}`,
            )
          }
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-10">
        <DetailCard title="Sessiegegevens" className="mb-6" contentClassName="p-4 flex flex-col gap-6">
          {/* Block 1: core fields — mirrors the first DetailBlock in SessionDetail */}
          <DetailBlock>
            <Row>
              <Label htmlFor="name">Naam</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Naam van de sessie"
                error={form.formState.errors.name?.message}
              />
            </Row>
            <Row>
              <Label htmlFor="date_time">Datum en verzameltijd</Label>
              <Input
                id="date_time"
                {...form.register("date_time")}
                type="datetime-local"
                error={form.formState.errors.date_time?.message}
              />
            </Row>
            <Row>
              <Label htmlFor="type">Type</Label>
              <Select id="type" {...form.register("type")} error={form.formState.errors.type?.message}>
                <option value="rehearsal">Repetitie</option>
                <option value="performance">Optreden</option>
                <option value="other">Overig</option>
              </Select>
            </Row>
            <Row>
              <Label>Groepen</Label>
              <div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {groupOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(option.value)}
                        onChange={(e) => handleGroupChange(option.value, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-[var(--text-primary)]">{option.label}</span>
                    </label>
                  ))}
                </div>
                {form.formState.errors.groups && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.groups.message}</p>
                )}
              </div>
            </Row>
            <Row>
              <Label htmlFor="default_attendance_state">Standaard status</Label>
              <Select id="default_attendance_state" {...form.register("default_attendance_state")}>
                <option value="">Selecteer standaard status</option>
                {ATTENDANCE_STATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Row>
            <Row>
              <Label htmlFor="threshold_orange">Drempel oranje (%)</Label>
              <Input id="threshold_orange" type="number" min="0" max="100" {...form.register("threshold_orange")} />
            </Row>
            <Row>
              <Label htmlFor="threshold_green">Drempel groen (%)</Label>
              <Input id="threshold_green" type="number" min="0" max="100" {...form.register("threshold_green")} />
            </Row>
            <Row>
              <Label htmlFor="description">Omschrijving</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Omschrijving van de sessie"
                rows={4}
              />
            </Row>
            {sessionType === "rehearsal" && (
              <Row>
                <Label htmlFor="rehearsal_marks">Repetitie aantekeningen</Label>
                <Textarea
                  id="rehearsal_marks"
                  {...form.register("rehearsal_marks")}
                  placeholder="Aantekeningen voor de repetitie"
                  rows={4}
                />
              </Row>
            )}
            {sessionType === "performance" && (
              <Row>
                <Label htmlFor="location">Locatie</Label>
                <Input id="location" {...form.register("location")} error={form.formState.errors.location?.message} />
              </Row>
            )}
          </DetailBlock>
          {/* Block 2: description */}
          <DetailBlock>
            {sessionType === "rehearsal" && (
              <Row>
                <Label>Aanwezigheid</Label>
                <div className="py-2">
                  <AttendanceCounters stateCounts={stateCounts} />
                </div>
              </Row>
            )}
          </DetailBlock>
        </DetailCard>

        {sessionType === "performance" && (
          <DetailCard title="Website" className="mb-6">
            <DetailBlock>
              <Row>
                <Label htmlFor="tickets">Toegang / kaartjes</Label>
                <Input id="tickets" {...form.register("tickets")} error={form.formState.errors.tickets?.message} />
              </Row>
              <Row>
                <Label htmlFor="website_tickets_url">Link naar ticketverkoop</Label>
                <Input
                  id="website_tickets_url"
                  {...form.register("website_tickets_url")}
                  error={form.formState.errors.website_tickets_url?.message}
                />
              </Row>
              <Row>
                <Label htmlFor="website_time">Aanvangstijd website</Label>
                <Input
                  id="website_time"
                  type="time"
                  {...form.register("website_time")}
                  error={form.formState.errors.website_time?.message}
                />
              </Row>
              <Row>
                <Label htmlFor="website_text">Website tekst</Label>
                <Textarea
                  id="website_text"
                  {...form.register("website_text")}
                  placeholder="Omschrijving website"
                  rows={4}
                />
              </Row>
              <Row>
                <Label htmlFor="website_report">Verslag voor de website</Label>
                <Textarea
                  id="website_report"
                  {...form.register("website_report")}
                  placeholder="Verslag voor de website"
                  rows={4}
                />
              </Row>
              <Row>
                <Label htmlFor="website_youtube_id">Youtube ID</Label>
                <Input
                  id="website_youtube_id"
                  {...form.register("website_youtube_id")}
                  error={form.formState.errors.website_youtube_id?.message}
                />
              </Row>
            </DetailBlock>
          </DetailCard>
        )}

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() =>
              navigate(
                isCreateMode ? `/sessions?${searchParams.toString()}` : `/sessions/${id}?${searchParams.toString()}`,
              )
            }
            color="gray"
            text="Annuleren"
            className="w-full md:w-auto md:min-w-[160px] justify-center"
          />
          <Button
            type="submit"
            disabled={createSessionMutation.isPending || updateSessionMutation.isPending || form.formState.isSubmitting}
            color="blue"
            text={createSessionMutation.isPending || updateSessionMutation.isPending ? "Opslaan..." : "Opslaan"}
            className="w-full md:w-auto md:min-w-[160px] justify-center"
          />
        </div>
      </form>

      {!isCreateMode && (
        <div className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttendanceByInstrumentGroup
              attendance={attendance}
              isSessionAdmin={!!pb.authStore.record?.is_session_admin}
            />
            {new Date(form.watch("date_time")) > new Date(Date.now() - 60 * 60 * 1000) && (
              <AttendanceByRow attendance={attendance} isSessionAdmin={!!pb.authStore.record?.is_session_admin} />
            )}
          </div>

          <div className="mt-8 glass-panel rounded-2xl overflow-hidden">
            <div className="glass-header px-4 py-3">
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Aanwezigheid leden</h3>
              <div className="flex flex-wrap gap-2">
                {new Date(form.watch("date_time")) > new Date(Date.now() + 120 * 60 * 1000) ? (
                  <>
                    <ActionButton
                      title="Komt"
                      onClick={() => handleSetState("will_be_present")}
                      disabled={selectedRowKeys.length === 0 || updatingAttendance}
                      bg="bg-green-600"
                    />
                    <ActionButton
                      title="Komt niet"
                      onClick={() => handleSetState("wont_be_present")}
                      disabled={selectedRowKeys.length === 0 || updatingAttendance}
                      bg="bg-red-600"
                    />
                  </>
                ) : (
                  <>
                    <ActionButton
                      title="Aanwezig"
                      onClick={() => handleSetState("present")}
                      disabled={selectedRowKeys.length === 0 || updatingAttendance}
                      bg="bg-green-600"
                    />
                    <ActionButton
                      title="Afwezig"
                      onClick={() => handleSetState("not_present")}
                      disabled={selectedRowKeys.length === 0 || updatingAttendance}
                      bg="bg-red-600"
                    />
                    <ActionButton
                      title="Aan/afmelding Bevestigen"
                      onClick={handleConfirmState}
                      disabled={selectedRowKeys.length === 0 || updatingAttendance}
                    />
                  </>
                )}
              </div>
            </div>

            <AttendanceTable
              attendance={attendance}
              selectedRowKeys={selectedRowKeys}
              setSelectedRowKeys={setSelectedRowKeys}
            />
          </div>
        </div>
      )}
    </PageContent>
  );
};

export default SessionEdit;
