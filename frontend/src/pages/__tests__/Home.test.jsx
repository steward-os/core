/* eslint-disable no-undef */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Home from "../Home";

// Mock dependencies
vi.mock("../../pb", () => ({
  default: {
    authStore: {
      record: { id: "user123" },
    },
    collection: vi.fn(),
  },
}));

vi.mock("../../utils/dateTimeUtils", () => ({
  formatDateTime: vi.fn().mockReturnValue("ma 20-01 15:30"),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../components/banners/BannerMessages", () => ({
  default: ({ messages }) => (
    <div data-testid="banner-messages">
      {messages?.map((msg) => (
        <div key={msg.id}>{msg.message}</div>
      ))}
    </div>
  ),
}));

vi.mock("../../components/List", () => ({
  ListContainer: ({ children, narrow }) => (
    <div data-testid="list-container" className={narrow ? "narrow" : ""}>
      {children}
    </div>
  ),
  ListHeading: ({ children }) => <h2 data-testid="list-heading">{children}</h2>,
  ListRow: ({ onClick, columns, children }) => (
    <div data-testid="list-row" onClick={onClick}>
      {columns?.map((col, idx) => (
        <div key={idx} style={{ width: col.width }} className={col.className}>
          {col.content}
        </div>
      ))}
      {children}
    </div>
  ),
  EmptyListMessage: ({ message }) => <div data-testid="empty-message">{message}</div>,
}));

describe("Home", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset the pb mock
    const { default: pb } = await import("../../pb");
    pb.collection.mockImplementation((collectionName) => {
      if (collectionName === "attendance") {
        return {
          getList: vi.fn().mockResolvedValue({
            items: [
              {
                id: "att1",
                state: "will_be_present",
                expand: {
                  session: {
                    name: "Repetitie Kerst",
                    date_time: "2025-01-20T14:30:00Z",
                    expand: {
                      groups: [{ name: "Harmonie" }],
                    },
                  },
                },
              },
              {
                id: "att2",
                state: "wont_be_present",
                expand: {
                  session: {
                    name: "Concert",
                    date_time: "2025-01-25T19:00:00Z",
                    expand: {
                      groups: [{ name: "Fanfare" }],
                    },
                  },
                },
              },
            ],
          }),
        };
      }
      if (collectionName === "banner_messages") {
        return {
          getList: vi.fn().mockResolvedValue({
            items: [
              { id: "banner1", message: "Important announcement!" },
              { id: "banner2", message: "New rehearsal scheduled" },
            ],
          }),
        };
      }
      return { getList: vi.fn().mockResolvedValue({ items: [] }) };
    });
  });

  it("renders loading state initially", async () => {
    render(<Home />);

    expect(screen.getByText("Laden...")).toBeInTheDocument();
    const spinner = screen.getByText("Laden...").previousSibling;
    expect(spinner).toHaveClass("animate-spin");
  });

  it("renders rehearsals list after loading", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Repetitie Kerst")).toBeInTheDocument();
      expect(screen.getByText("Concert")).toBeInTheDocument();
    });

    expect(screen.getByText("Harmonie")).toBeInTheDocument();
    expect(screen.getByText("Fanfare")).toBeInTheDocument();
    expect(screen.getAllByText("ma 20-01 15:30")).toHaveLength(2);
  });

  it("renders attendance states with correct styling", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Aangemeld")).toBeInTheDocument();
      expect(screen.getByText("Afgemeld")).toBeInTheDocument();
    });

    const aangemeldBadge = screen.getByText("Aangemeld");
    const afgemeldBadge = screen.getByText("Afgemeld");

    expect(aangemeldBadge).toHaveClass("bg-green-100", "text-green-800");
    expect(afgemeldBadge).toHaveClass("bg-orange-100", "text-orange-800");
  });

  it("renders banner messages", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Important announcement!")).toBeInTheDocument();
      expect(screen.getByText("New rehearsal scheduled")).toBeInTheDocument();
    });
  });

  it("navigates to session detail when clicking on rehearsal", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Repetitie Kerst")).toBeInTheDocument();
    });

    const rehearsalRow = screen.getByText("Repetitie Kerst").closest('[data-testid="list-row"]');
    await user.click(rehearsalRow);

    expect(mockNavigate).toHaveBeenCalledWith("/attendance/att1");
  });

  it("renders empty state when no rehearsals", async () => {
    const { default: pb } = await import("../../pb");
    pb.collection.mockImplementation((collectionName) => {
      if (collectionName === "attendance") {
        return {
          getList: vi.fn().mockResolvedValue({ items: [] }),
        };
      }
      if (collectionName === "banner_messages") {
        return {
          getList: vi.fn().mockResolvedValue({ items: [] }),
        };
      }
      return { getList: vi.fn().mockResolvedValue({ items: [] }) };
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Geen repetities of optredens gevonden.")).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    const { default: pb } = await import("../../pb");
    pb.collection.mockImplementation((collectionName) => {
      if (collectionName === "attendance") {
        return {
          getList: vi.fn().mockRejectedValue(new Error("API Error")),
        };
      }
      if (collectionName === "banner_messages") {
        return {
          getList: vi.fn().mockRejectedValue(new Error("API Error")),
        };
      }
      return { getList: vi.fn().mockResolvedValue({ items: [] }) };
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Geen repetities of optredens gevonden.")).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith("Error fetching attendance:", expect.any(Error));
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching banner messages:", expect.any(Error));

    consoleSpy.mockRestore();
  });

  it("handles unknown attendance states", async () => {
    const { default: pb } = await import("../../pb");
    pb.collection.mockImplementation((collectionName) => {
      if (collectionName === "attendance") {
        return {
          getList: vi.fn().mockResolvedValue({
            items: [
              {
                id: "att1",
                state: "unknown_state",
                expand: {
                  session: {
                    name: "Test Session",
                    date_time: "2025-01-20T14:30:00Z",
                    expand: { groups: [{ name: "Test Group" }] },
                  },
                },
              },
            ],
          }),
        };
      }
      if (collectionName === "banner_messages") {
        return {
          getList: vi.fn().mockResolvedValue({ items: [] }),
        };
      }
      return { getList: vi.fn().mockResolvedValue({ items: [] }) };
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("unknown_state")).toBeInTheDocument();
    });

    const unknownBadge = screen.getByText("unknown_state");
    expect(unknownBadge).toHaveClass("bg-gray-100", "text-gray-800");
  });

  it("fetches data with correct parameters", async () => {
    const { default: pb } = await import("../../pb");
    const mockGetList = vi.fn().mockResolvedValue({ items: [] });
    pb.collection.mockImplementation(() => ({
      getList: mockGetList,
    }));

    render(<Home />);

    await waitFor(() => {
      expect(mockGetList).toHaveBeenCalledWith(1, 300, {
        expand: "session, session.groups, group_member, group_member.user, group_member.section",
        filter:
          expect.stringContaining('session.date_time >= "') &&
          expect.stringContaining('group_member.user = "user123"'),
        sort: "session.date_time",
      });
    });

    await waitFor(() => {
      expect(mockGetList).toHaveBeenCalledWith(1, 50, {
        filter: "active=true",
        sort: "created",
      });
    });
  });
});
