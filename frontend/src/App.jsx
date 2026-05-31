import { lazy, Suspense, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import CenteredSpinner from "./components/CenteredSpinner";
import Home from "./pages/Home";
import AttendanceMatrix from "./pages/Session/AttendanceMatrix";
import Session from "./pages/Session/SessionDetail";
import SessionCanvasPage from "./pages/Session/SessionCanvasPage";
import SessionEdit from "./pages/Session/SessionEdit";
import Sessions from "./pages/Session/SessionList";
import UserSessionDetail from "./pages/Session/UserSessionDetail";
import UserDetail from "./pages/User/UserDetail";
import UserEdit from "./pages/User/UserEdit";
import Users from "./pages/User/UserList";

import GroupDetail from "./pages/Group/GroupDetail";
import GroupEdit from "./pages/Group/GroupEdit";
import Groups from "./pages/Group/GroupList";

import ScrollToTop from "./components/ScrollToTop";
import AppHeader from "./features/app/AppHeader";
import Auth from "./features/app/Auth";
import BottomNavigation from "./features/app/BottomNavigation";
import ActionDetail from "./pages/Action/ActionDetail";
import ActionList from "./pages/Action/ActionList";
import ParameterDetail from "./pages/Admin/Parameter/ParameterDetail";
import ParameterEdit from "./pages/Admin/Parameter/ParameterEdit";
import ParameterList from "./pages/Admin/Parameter/ParameterList";
import MediaFileDetail from "./pages/Admin/MediaFile/MediaFileDetail";
import MediaFileEdit from "./pages/Admin/MediaFile/MediaFileEdit";
import MediaFileList from "./pages/Admin/MediaFile/MediaFileList";
import EncryptiePage from "./pages/Admin/Encryptie/EncryptiePage";
import BannerDetail from "./pages/Banner/BannerDetail";
import BannerEdit from "./pages/Banner/BannerEdit";
import BannerList from "./pages/Banner/BannerList";
import CorrespondenceDetail from "./pages/Correspondence/CorrespondenceDetail";
import CorrespondenceList from "./pages/Correspondence/CorrespondenceList";
import EmailTemplateList from "./pages/EmailTemplate/EmailTemplateList";
import EmailTemplateEditor from "./pages/EmailTemplate/EmailTemplateEditor";
import TemplateBlockList from "./pages/EmailTemplate/TemplateBlockList";
import MailingList from "./pages/Mailing/MailingList";
import MailingEdit from "./pages/Mailing/MailingEdit";
import MailingBlockList from "./pages/MailingBlock/MailingBlockList";
import MeetingDetail from "./pages/Meeting/MeetingDetail";
import MeetingEdit from "./pages/Meeting/MeetingEdit";
import MeetingList from "./pages/Meeting/MeetingList";
import MeetingMinutes from "./pages/MeetingMinutes";
import MeetingTemplateDetail from "./pages/MeetingTemplate/MeetingTemplateDetail";
import MeetingTemplateEdit from "./pages/MeetingTemplate/MeetingTemplateEdit";
import MeetingTemplateList from "./pages/MeetingTemplate/MeetingTemplateList";
import MessageDetail from "./pages/Message/MessageDetail";
import MessageEdit from "./pages/Message/MessageEdit";
import MessageList from "./pages/Message/MessageList";
import MusicPlayer from "./pages/MusicPlayer";
import MusicRecordingDetail from "./pages/MusicRecording/MusicRecordingDetail";
import MusicRecordingEdit from "./pages/MusicRecording/MusicRecordingEdit";
import MusicRecordingList from "./pages/MusicRecording/MusicRecordingList";
import MusicRecordings from "./pages/MusicRecordings";
import NotificationTest from "./pages/NotificationSettings";
import ProjectDetail from "./pages/Project/ProjectDetail";
import ProjectEdit from "./pages/Project/ProjectEdit";
import ProjectList from "./pages/Project/ProjectList";
import RelationDetail from "./pages/Relation/RelationDetail";
import RelationEdit from "./pages/Relation/RelationEdit";
import RelationImport from "./pages/Relation/RelationImport";
import RelationList from "./pages/Relation/RelationList";
import ResetAccount from "./pages/ResetAccount";
import SetPassword from "./pages/SetPassword";
import StandardReactionDetail from "./pages/StandardReaction/StandardReactionDetail";
import StandardReactionEdit from "./pages/StandardReaction/StandardReactionEdit";
import StandardReactionList from "./pages/StandardReaction/StandardReactionList";
import TagDetail from "./pages/Tag/TagDetail";
import TagEdit from "./pages/Tag/TagEdit";
import TagList from "./pages/Tag/TagList";
import Tools from "./pages/Tools";
import Tuner from "./pages/Tuner";
import EncryptionKeys from "./pages/Account/EncryptionKeys";
import Logout from "./pages/Account/Logout";
import VolunteeringDetail from "./pages/Volunteering/VolunteeringDetail";
import VolunteeringEdit from "./pages/Volunteering/VolunteeringEdit";
import VolunteeringList from "./pages/Volunteering/VolunteeringList";
import pb from "./pb";
const FiscalYearList = lazy(() => import("./pages/Finance/FiscalYear/FiscalYearList"));
const FiscalYearEdit = lazy(() => import("./pages/Finance/FiscalYear/FiscalYearEdit"));
const LedgerAccountList = lazy(() => import("./pages/Finance/LedgerAccount/LedgerAccountList"));
const LedgerAccountDetail = lazy(() => import("./pages/Finance/LedgerAccount/LedgerAccountDetail"));
const LedgerAccountEdit = lazy(() => import("./pages/Finance/LedgerAccount/LedgerAccountEdit"));
const JournalTransactionList = lazy(() => import("./pages/Finance/JournalTransaction/JournalTransactionList"));
const JournalTransactionDetail = lazy(() => import("./pages/Finance/JournalTransaction/JournalTransactionDetail"));
const JournalTransactionEdit = lazy(() => import("./pages/Finance/JournalTransaction/JournalTransactionEdit"));
const SalesInvoiceList = lazy(() => import("./pages/Finance/SalesInvoice/SalesInvoiceList"));
const SalesInvoiceDetail = lazy(() => import("./pages/Finance/SalesInvoice/SalesInvoiceDetail"));
const SalesInvoiceEdit = lazy(() => import("./pages/Finance/SalesInvoice/SalesInvoiceEdit"));
const PurchaseInvoiceList = lazy(() => import("./pages/Finance/PurchaseInvoice/PurchaseInvoiceList"));
const PurchaseInvoiceDetail = lazy(() => import("./pages/Finance/PurchaseInvoice/PurchaseInvoiceDetail"));
const PurchaseInvoiceEdit = lazy(() => import("./pages/Finance/PurchaseInvoice/PurchaseInvoiceEdit"));
const BankStatementLineList = lazy(() => import("./pages/Finance/BankStatementLine/BankStatementLineList"));
const BankStatementLineEdit = lazy(() => import("./pages/Finance/BankStatementLine/BankStatementLineEdit"));
const BankStatementImport = lazy(() => import("./pages/Finance/BankStatementLine/BankStatementImport"));
const FinancialOverview = lazy(() => import("./pages/Finance/FinancialOverview/FinancialOverview"));
const TrialBalance = lazy(() => import("./pages/Finance/TrialBalance/TrialBalance"));
const MemberList = lazy(() => import("./pages/Finance/Member/MemberList"));
const MemberDetail = lazy(() => import("./pages/Finance/Member/MemberDetail"));
const MemberEdit = lazy(() => import("./pages/Finance/Member/MemberEdit"));
const BatchRunList = lazy(() => import("./pages/Finance/BatchRun/BatchRunList"));
const BatchRunDetail = lazy(() => import("./pages/Finance/BatchRun/BatchRunDetail"));
const BatchRunEdit = lazy(() => import("./pages/Finance/BatchRun/BatchRunEdit"));

import SubNavLayout from "./components/Page/SubNavLayout";
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import { useAppHeaderVisibility } from "./hooks/useAppHeaderVisibility";
import { usePWAUpdate } from "./hooks/usePWAUpdate";

// Component to handle conditional layout
const AppLayout = ({
  children,
  isSessionAdmin,
  isAdmin,
  isVolunteerAdmin,
  isBannerAdmin,
  isBoardMember,
  isFinancialAdmin,
}) => {
  const { isAppHeaderVisible, isMobile } = useAppHeaderVisibility();

  return (
    <div className="min-h-screen px-4 md:px-0">
      <AppHeader
        isSessionAdmin={isSessionAdmin}
        isAdmin={isAdmin}
        isVolunteerAdmin={isVolunteerAdmin}
        isBannerAdmin={isBannerAdmin}
        isBoardMember={isBoardMember}
        isFinancialAdmin={isFinancialAdmin}
        className="fixed top-0 left-0 right-0 z-50 h-12"
      />
      <main className={`pb-20 ${isAppHeaderVisible && !isMobile ? "pt-12" : "pt-6"}`}>
        <SubNavLayout
          isAdmin={isAdmin}
          isBoardMember={isBoardMember}
          isSessionAdmin={isSessionAdmin}
          isFinancialAdmin={isFinancialAdmin}
          isVolunteerAdmin={isVolunteerAdmin}
          isBannerAdmin={isBannerAdmin}
        >
          {children}
        </SubNavLayout>
      </main>
      <BottomNavigation />
      <PushNotificationPrompt />
    </div>
  );
};

const App = () => {
  const [_auth, setAuth] = useState(null);
  const isSessionAdmin = !!pb.authStore.record?.is_session_admin;
  const isAdmin = !!pb.authStore.record?.leden_app_admin;
  const isVolunteerAdmin = !!pb.authStore.record?.leden_app_volunteer_admin;
  const isBannerAdmin = !!pb.authStore.record?.leden_app_banner_admin;
  const isBoardMember = !!pb.authStore.record?.is_board_member;
  const isFinancialAdmin = !!pb.authStore.record?.is_finance_admin;
  const canSendMessages = !!pb.authStore.record?.can_send_messages || isAdmin;

  // Initialize PWA auto-update functionality
  usePWAUpdate();

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/reset_account" element={<ResetAccount />} />
        <Route path="/set_password/:token" element={<SetPassword />} />
        <Route
          path="/*"
          element={
            !pb.authStore.isValid ? (
              <Auth onAuth={setAuth} />
            ) : (
              <AppLayout
                isSessionAdmin={isSessionAdmin}
                isAdmin={isAdmin}
                isVolunteerAdmin={isVolunteerAdmin}
                isBannerAdmin={isBannerAdmin}
                isBoardMember={isBoardMember}
                isFinancialAdmin={isFinancialAdmin}
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/attendance/:id" element={<UserSessionDetail />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/tuner" element={<Tuner />} />
                  <Route path="/account/sleutels" element={<EncryptionKeys />} />
                  <Route path="/account/logout" element={<Logout />} />
                  <Route path="/music-recordings" element={<MusicRecordings />} />
                  <Route path="/music-player/:videoId" element={<MusicPlayer />} />
                  <Route path="/notification-settings" element={<NotificationTest />} />
                  <Route path="/volunteering" element={<VolunteeringList isVolunteerAdmin={isVolunteerAdmin} />} />
                  <Route path="/volunteering/new" element={<VolunteeringEdit isVolunteerAdmin={isVolunteerAdmin} />} />
                  <Route
                    path="/volunteering/:id"
                    element={<VolunteeringDetail isVolunteerAdmin={isVolunteerAdmin} />}
                  />
                  <Route
                    path="/volunteering/:id/edit"
                    element={<VolunteeringEdit isVolunteerAdmin={isVolunteerAdmin} />}
                  />
                  {isSessionAdmin && (
                    <>
                      <Route path="/sessions" element={<Sessions isSessionAdmin={isSessionAdmin} />} />
                      <Route path="/sessions/new" element={<SessionEdit />} />
                      <Route path="/sessions/:id/edit" element={<SessionEdit />} />
                      <Route path="/sessions/:id/canvas" element={<SessionCanvasPage isSessionAdmin={isSessionAdmin} />} />
                      <Route path="/sessions/:id" element={<Session isSessionAdmin={isSessionAdmin} />} />
                      <Route path="/attendance-matrix" element={<AttendanceMatrix />} />
                    </>
                  )}
                  {isBannerAdmin && (
                    <>
                      <Route path="/banners" element={<BannerList />} />
                      <Route path="/banners/new" element={<BannerEdit />} />
                      <Route path="/banners/:id" element={<BannerDetail />} />
                      <Route path="/banners/:id/edit" element={<BannerEdit />} />
                    </>
                  )}
                  <Route path="/messages" element={<MessageList />} />
                  <Route path="/messages/:id" element={<MessageDetail />} />
                  {canSendMessages && (
                    <>
                      <Route path="/messages/new" element={<MessageEdit />} />
                      <Route path="/messages/:id/edit" element={<MessageEdit />} />
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <Route path="/users" element={<Users />} />
                      <Route path="/users/new" element={<UserEdit />} />
                      <Route path="/users/:id" element={<UserDetail />} />
                      <Route path="/users/:id/edit" element={<UserEdit />} />
                      <Route path="/groups" element={<Groups />} />
                      <Route path="/groups/new" element={<GroupEdit />} />
                      <Route path="/groups/:id" element={<GroupDetail />} />
                      <Route path="/groups/:id/edit" element={<GroupEdit />} />
                      <Route path="/standard-reactions" element={<StandardReactionList />} />
                      <Route path="/standard-reactions/new" element={<StandardReactionEdit />} />
                      <Route path="/standard-reactions/:id" element={<StandardReactionDetail />} />
                      <Route path="/standard-reactions/:id/edit" element={<StandardReactionEdit />} />
                      <Route path="/meeting-templates" element={<MeetingTemplateList />} />
                      <Route path="/meeting-templates/new" element={<MeetingTemplateEdit />} />
                      <Route path="/meeting-templates/:id" element={<MeetingTemplateDetail />} />
                      <Route path="/meeting-templates/:id/edit" element={<MeetingTemplateEdit />} />
                      <Route path="/tags" element={<TagList />} />
                      <Route path="/tags/new" element={<TagEdit />} />
                      <Route path="/tags/:id" element={<TagDetail />} />
                      <Route path="/tags/:id/edit" element={<TagEdit />} />
                      <Route path="/music-recordings-admin" element={<MusicRecordingList />} />
                      <Route path="/music-recordings-admin/new" element={<MusicRecordingEdit />} />
                      <Route path="/music-recordings-admin/:id" element={<MusicRecordingDetail />} />
                      <Route path="/music-recordings-admin/:id/edit" element={<MusicRecordingEdit />} />
                      <Route path="/meetings" element={<MeetingList />} />
                      <Route path="/meetings/new" element={<MeetingEdit />} />
                      <Route path="/meetings/:id" element={<MeetingDetail />} />
                      <Route path="/meetings/:id/edit" element={<MeetingEdit />} />
                      <Route path="/meetings/:id/notes" element={<MeetingMinutes />} />
                      <Route path="/parameters" element={<ParameterList />} />
                      <Route path="/parameters/new" element={<ParameterEdit />} />
                      <Route path="/parameters/:id" element={<ParameterDetail />} />
                      <Route path="/parameters/:id/edit" element={<ParameterEdit />} />
                      <Route path="/media-files" element={<MediaFileList />} />
                      <Route path="/media-files/new" element={<MediaFileEdit />} />
                      <Route path="/media-files/:id" element={<MediaFileDetail />} />
                      <Route path="/media-files/:id/edit" element={<MediaFileEdit />} />
                      <Route path="/encryptie" element={<EncryptiePage />} />
                    </>
                  )}
                  {isBoardMember && (
                    <>
                      <Route path="/actions" element={<ActionList />} />
                      <Route path="/actions/:id" element={<ActionDetail />} />
                      <Route path="/projects" element={<ProjectList />} />
                      <Route path="/projects/new" element={<ProjectEdit />} />
                      <Route path="/projects/:id" element={<ProjectDetail />} />
                      <Route path="/projects/:id/edit" element={<ProjectEdit />} />
                      <Route path="/relations" element={<RelationList />} />
                      <Route path="/relations/import" element={<RelationImport />} />
                      <Route path="/relations/new" element={<RelationEdit />} />
                      <Route path="/relations/:id" element={<RelationDetail />} />
                      <Route path="/relations/:id/edit" element={<RelationEdit />} />
                      <Route path="/correspondence" element={<CorrespondenceList />} />
                      <Route path="/correspondence/:id" element={<CorrespondenceDetail />} />
                      <Route path="/email-templates" element={<EmailTemplateList />} />
                      <Route path="/email-templates/:id" element={<EmailTemplateEditor />} />
                      <Route path="/email-templates/:id/blocks" element={<TemplateBlockList />} />
                      <Route path="/mailing-blocks" element={<MailingBlockList />} />
                      <Route path="/mailings" element={<MailingList />} />
                      <Route path="/mailings/:id/edit" element={<MailingEdit />} />
                    </>
                  )}
                  {isFinancialAdmin && (
                    <Route
                      path="/finance/*"
                      element={
                        <Suspense fallback={<CenteredSpinner />}>
                          <Routes>
                            <Route path="overview" element={<FinancialOverview />} />
                            <Route path="trial-balance" element={<TrialBalance />} />
                            <Route path="fiscal-years" element={<FiscalYearList />} />
                            <Route path="fiscal-years/new" element={<FiscalYearEdit />} />
                            <Route path="fiscal-years/:id/edit" element={<FiscalYearEdit />} />
                            <Route path="ledger-accounts" element={<LedgerAccountList />} />
                            <Route path="ledger-accounts/new" element={<LedgerAccountEdit />} />
                            <Route path="ledger-accounts/:id" element={<LedgerAccountDetail />} />
                            <Route path="ledger-accounts/:id/edit" element={<LedgerAccountEdit />} />
                            <Route path="journal-transactions" element={<JournalTransactionList />} />
                            <Route path="journal-transactions/new" element={<JournalTransactionEdit />} />
                            <Route path="journal-transactions/:id" element={<JournalTransactionDetail />} />
                            <Route path="journal-transactions/:id/edit" element={<JournalTransactionEdit />} />
                            <Route path="sales-invoices" element={<SalesInvoiceList />} />
                            <Route path="sales-invoices/new" element={<SalesInvoiceEdit />} />
                            <Route path="sales-invoices/:id" element={<SalesInvoiceDetail />} />
                            <Route path="sales-invoices/:id/edit" element={<SalesInvoiceEdit />} />
                            <Route path="purchase-invoices" element={<PurchaseInvoiceList />} />
                            <Route path="purchase-invoices/new" element={<PurchaseInvoiceEdit />} />
                            <Route path="purchase-invoices/:id" element={<PurchaseInvoiceDetail />} />
                            <Route path="purchase-invoices/:id/edit" element={<PurchaseInvoiceEdit />} />
                            <Route path="members" element={<MemberList />} />
                            <Route path="members/new" element={<MemberEdit />} />
                            <Route path="members/:id" element={<MemberDetail />} />
                            <Route path="members/:id/edit" element={<MemberEdit />} />
                            <Route path="bank-statement-lines" element={<BankStatementLineList />} />
                            <Route path="bank-statement-lines/import" element={<BankStatementImport />} />
                            <Route path="bank-statement-lines/new" element={<BankStatementLineEdit />} />
                            <Route path="bank-statement-lines/:id/edit" element={<BankStatementLineEdit />} />
                            <Route path="batch-runs" element={<BatchRunList />} />
                            <Route path="batch-runs/new" element={<BatchRunEdit />} />
                            <Route path="batch-runs/:id" element={<BatchRunDetail />} />
                            <Route path="batch-runs/:id/edit" element={<BatchRunEdit />} />
                          </Routes>
                        </Suspense>
                      }
                    />
                  )}
                </Routes>
              </AppLayout>
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
