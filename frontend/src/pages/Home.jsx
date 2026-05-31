import { useNavigate, useSearchParams } from "react-router-dom";
import AttendanceList from "../features/home/AttendanceList";
import { FilterRow, ListContainer, ListHeading } from "../components/List";
import BannerMessages from "../features/banners/BannerMessages";
import { useHomeData } from "../hooks/useHomeData";

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "Alle" },
  { value: "performance", label: "Optredens" },
  { value: "rehearsal", label: "Repetities" },
];

const Home = (volunteering = false) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const typeFilter = searchParams.get("typeFilter") || "all";
  const setTypeFilter = (value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newParams.delete("typeFilter");
    } else {
      newParams.set("typeFilter", value);
    }
    setSearchParams(newParams);
  };

  const { rehearsals, sessionStats, bannerMessages, loading } = useHomeData(typeFilter);

  const handleItemClick = (attendance) => {
    navigate(`/attendance/${attendance.id}`);
  };

  return (
    <ListContainer fullWidth>
      <BannerMessages messages={bannerMessages} />
      <ListHeading>Agenda</ListHeading>

      <AttendanceList
        rehearsals={rehearsals}
        sessionStats={sessionStats}
        loading={loading}
        onItemClick={handleItemClick}
        filterRow={<FilterRow options={TYPE_FILTER_OPTIONS} value={typeFilter} onChange={setTypeFilter} />}
      />
    </ListContainer>
  );
};

export default Home;
