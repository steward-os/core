import { useState, useEffect, useCallback } from 'react';
import pb from '../pb';

export const useHomeData = (typeFilter = "all") => {
  const [rehearsals, setRehearsals] = useState([]);
  const [sessionStats, setSessionStats] = useState({});
  const [bannerMessages, setBannerMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const userId = pb.authStore.record?.id;
      const today = new Date().toISOString().slice(0, 10);
      const filters = [
        `session.date_time >= "${today}"`,
        `group_member.user = "${userId}"`,
      ];
      if (typeFilter !== "all") {
        filters.push(`session.type = "${typeFilter}"`);
      }
      const attendance = await pb.collection("mb_attendance").getList(1, 300, {
        expand: "session, session.groups, group_member, group_member.user, group_member.section",
        filter: filters.join(" && "),
        sort: "session.date_time",
      });
      setRehearsals(attendance.items);

      const sessionIds = attendance.items.map((a) => a.session);
      if (sessionIds.length > 0) {
        try {
          const allRecs = await pb.collection("mb_attendance").getFullList({
            filter: sessionIds.map((id) => `session = "${id}"`).join(" || "),
            fields: "session,state",
          });
          const stats = {};
          for (const rec of allRecs) {
            if (!stats[rec.session]) stats[rec.session] = { total: 0, present: 0 };
            stats[rec.session].total++;
            if (rec.state === "will_be_present" || rec.state === "present") {
              stats[rec.session].present++;
            }
          }
          setSessionStats(stats);
        } catch (error) {
          console.error("Error fetching session stats:", error);
        }
      } else {
        setSessionStats({});
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setRehearsals([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  const fetchBannerMessages = useCallback(async () => {
    try {
      const result = await pb.collection("mb_banner_messages").getList(1, 50, {
        filter: "active=true",
        sort: "created",
      });
      setBannerMessages(result.items);
    } catch (error) {
      console.error("Error fetching banner messages:", error);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
    fetchBannerMessages();
  }, [fetchAttendance, fetchBannerMessages]);

  return {
    rehearsals,
    sessionStats,
    bannerMessages,
    loading,
    fetchAttendance
  };
};