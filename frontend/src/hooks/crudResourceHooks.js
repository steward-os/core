import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createResourceHooks } from './createResourceHooks';

import { bulkCreateBankStatementLines, createBankStatementLine, deleteBankStatementLine, getBankStatementLine, getBankStatementLines, updateBankStatementLine } from '../services/bankStatementService';
import { createBatchRun, deleteBatchRun, getAllBatchRuns, getBatchRun, getBatchRuns, updateBatchRun } from '../services/batchRunService';
import { createBanner, deleteBanner, getBanner, getBanners, updateBanner } from '../services/bannerService';
import { createFiscalYear, deleteFiscalYear, getFiscalYear, getFiscalYears, updateFiscalYear } from '../services/fiscalYearService';
import { createJournalTransaction, deleteJournalTransaction, getJournalTransaction, getJournalTransactions, updateJournalTransaction } from '../services/journalTransactionService';
import { createLedgerAccount, deleteLedgerAccount, getAllLedgerAccounts, getLedgerAccount, getLedgerAccounts, updateLedgerAccount } from '../services/ledgerAccountService';
import { createMeeting, deleteMeeting, getMeeting, getMeetings, updateMeeting } from '../services/meetingService';
import { createMusicRecording, deleteMusicRecording, getMusicRecording, getMusicRecordings, updateMusicRecording } from '../services/musicRecordingService';
import { createMeetingTemplate, deleteMeetingTemplate, getMeetingTemplate, getMeetingTemplates, updateMeetingTemplate } from '../services/meetingTemplateService';
import { createParameter, deleteParameter, getParameter, getParametersPage, updateParameter } from '../services/parameterService';
import { createProject, deleteProject, getProject, getProjectNotes, getProjects, updateProject } from '../services/projectService';
import { bulkCreateRelations, createRelation, deleteRelation, getAllRelations, getRelation, getRelations, updateRelation } from '../services/relationService';
import { createSalesInvoice, deleteSalesInvoice, getAllInvoices, getSalesInvoice, getSalesInvoices, updateSalesInvoice } from '../services/salesInvoiceService';
import { createSession, deleteSession, duplicateSession, getSession, getSessions, getSessionWithAttendance, updateSession } from '../services/sessionService';
import { createUser, deleteUser, getUser, getUsersPaginated, updateUser } from '../services/userService';
import { createBsAction, deleteBsAction, getBsAction, getBsActions, updateBsAction } from '../services/bsActionService';
import { createEmail, deleteEmail, getEmail, getEmails, updateEmail } from '../services/emailService';
import { createEmailTemplate, deleteEmailTemplate, getEmailTemplate, getEmailTemplates, updateEmailTemplate } from '../services/emailTemplateService';
import { createMailing, deleteMailing, getMailing, getMailings, updateMailing } from '../services/mailingService';
import { createMailingTemplateBlock, deleteMailingTemplateBlock, getMailingTemplateBlock, getMailingTemplateBlocks, updateMailingTemplateBlock } from '../services/mailingTemplateBlockService';
import { createMailingBlock, deleteMailingBlock, getMailingBlock, getMailingBlocks, updateMailingBlock } from '../services/mailingBlockService';
import { createMediaFile, deleteMediaFile, getMediaFile, getMediaFilesPage, updateMediaFile } from '../services/mediaFileService';
import { createVolunteering, deleteVolunteering, duplicateVolunteering, getVolunteeringFiltered, getVolunteeringJob, getVolunteeringList, updateVolunteering } from '../services/volunteeringService';
import { createSetting, deleteSetting, getSetting, getSettings, updateSetting } from '../services/settingService';

// --- Banners ---
const { useList: _useBannerList, useOne: useBanner, useCreate: useCreateBanner, useUpdate: useUpdateBanner, useDelete: useDeleteBanner } =
  createResourceHooks('banners', {
    getList: (_, __, options) => getBanners(options),
    getOne: getBanner,
    create: createBanner,
    update: updateBanner,
    remove: deleteBanner,
  });

// Banners are always fetched in full (no pagination), so wrap with a simpler signature.
export const useBanners = (options = {}) => _useBannerList(1, 1, options);
export { useBanner, useCreateBanner, useDeleteBanner, useUpdateBanner };

// --- Music Recordings ---
const { useList: _useMusicRecordingList, useOne: useMusicRecording, useCreate: useCreateMusicRecording, useUpdate: useUpdateMusicRecording, useDelete: useDeleteMusicRecording } =
  createResourceHooks('musicRecordings', {
    getList: (_, __, options) => getMusicRecordings(options),
    getOne: getMusicRecording,
    create: createMusicRecording,
    update: updateMusicRecording,
    remove: deleteMusicRecording,
  });

export const useMusicRecordings = (options = {}) => _useMusicRecordingList(1, 1, options);
export { useMusicRecording, useCreateMusicRecording, useDeleteMusicRecording, useUpdateMusicRecording };


// --- Bs Actions ---
export const { useList: useBsActions, useOne: useBsAction, useCreate: useCreateBsAction, useUpdate: useUpdateBsAction, useDelete: useDeleteBsAction, useDeleteWithConfirm: useDeleteBsActionWithConfirm } =
  createResourceHooks('bsActions', {
    getList: (page, perPage, options) => getBsActions({ ...options, page, perPage }),
    getOne: (id, options) => getBsAction(id, options),
    create: createBsAction,
    update: updateBsAction,
    remove: deleteBsAction,
  }, { confirmMessage: "Weet je zeker dat je deze actie wilt verwijderen?" });

// --- Meetings ---
export const { useList: useMeetings, useOne: useMeeting, useCreate: useCreateMeeting, useUpdate: useUpdateMeeting, useDelete: useDeleteMeeting, useDeleteWithConfirm: useDeleteMeetingWithConfirm } =
  createResourceHooks('meetings', {
    getList: getMeetings,
    getOne: getMeeting,
    create: createMeeting,
    update: updateMeeting,
    remove: deleteMeeting,
  }, { confirmMessage: "Weet je zeker dat je deze vergadering wilt verwijderen?" });

// --- Meeting Templates ---
export const { useList: useMeetingTemplates, useOne: useMeetingTemplate, useCreate: useCreateMeetingTemplate, useUpdate: useUpdateMeetingTemplate, useDelete: useDeleteMeetingTemplate, useDeleteWithConfirm: useDeleteMeetingTemplateWithConfirm } =
  createResourceHooks('meetingTemplates', {
    getList: getMeetingTemplates,
    getOne: getMeetingTemplate,
    create: createMeetingTemplate,
    update: updateMeetingTemplate,
    remove: deleteMeetingTemplate,
  }, { confirmMessage: "Weet je zeker dat je deze template wilt verwijderen?" });

// --- Users ---
export const { useList: useUsers, useOne: useUser, useCreate: useCreateUser, useUpdate: useUpdateUser, useDelete: useDeleteUser, useDeleteWithConfirm: useDeleteUserWithConfirm } =
  createResourceHooks('users', {
    getList: getUsersPaginated,
    getOne: getUser,
    create: createUser,
    update: updateUser,
    remove: deleteUser,
  }, { confirmMessage: "Weet je zeker dat je deze gebruiker wilt verwijderen?" });

// --- Sessions ---
export const { useList: useSessions, useOne: useSession, useCreate: useCreateSession, useUpdate: useUpdateSession, useDelete: useDeleteSession, useDeleteWithConfirm: useDeleteSessionWithConfirm } =
  createResourceHooks('sessions', {
    getList: getSessions,
    getOne: getSession,
    create: createSession,
    update: updateSession,
    remove: deleteSession,
  }, { listOptions: { staleTime: 30 * 1000 }, confirmMessage: "Weet je zeker dat je deze sessie wilt verwijderen?" });

export function useSessionWithAttendance(id) {
  return useQuery({
    queryKey: ['sessions', id, 'attendance'],
    queryFn: () => getSessionWithAttendance(id),
    enabled: !!id,
  });
}

export function useDuplicateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: duplicateSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

// --- Volunteering ---
export const { useList: useVolunteering, useOne: useVolunteeringJob, useCreate: useCreateVolunteering, useUpdate: useUpdateVolunteering, useDelete: useDeleteVolunteering, useDeleteWithConfirm: useDeleteVolunteeringWithConfirm } =
  createResourceHooks('volunteering', {
    getList: getVolunteeringList,
    getOne: getVolunteeringJob,
    create: createVolunteering,
    update: updateVolunteering,
    remove: deleteVolunteering,
  }, { confirmMessage: "Weet je zeker dat je deze vrijwilligerstaak wilt verwijderen?" });

export function useVolunteeringFiltered(options = {}) {
  return useQuery({
    queryKey: ['volunteering', 'filtered', options],
    queryFn: () => getVolunteeringFiltered(options),
    placeholderData: (prev) => prev,
    staleTime: 0,
  });
}

export function useDuplicateVolunteering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: duplicateVolunteering,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteering'] });
    },
  });
}

// --- Projects ---
export const { useList: useProjects, useOne: useProject, useCreate: useCreateProject, useUpdate: useUpdateProject, useDelete: useDeleteProject, useDeleteWithConfirm: useDeleteProjectWithConfirm } =
  createResourceHooks('projects', {
    getList: (page, perPage, options) => getProjects({ ...options, page, perPage }),
    getOne: getProject,
    create: createProject,
    update: updateProject,
    remove: deleteProject,
  }, { confirmMessage: "Weet je zeker dat je dit project wilt verwijderen?" });

export function useProjectNotes(projectId, options = {}) {
  return useQuery({
    queryKey: ['projects', projectId, 'notes', options],
    queryFn: () => getProjectNotes(projectId, options),
    enabled: !!projectId,
  });
}

// --- Relations ---
export const { useList: useRelations, useOne: useRelation, useCreate: useCreateRelation, useUpdate: useUpdateRelation, useDelete: useDeleteRelation, useDeleteWithConfirm: useDeleteRelationWithConfirm } =
  createResourceHooks('relations', {
    getList: getRelations,
    getOne: getRelation,
    create: createRelation,
    update: updateRelation,
    remove: deleteRelation,
  }, { listOptions: { staleTime: 30 * 1000 }, confirmMessage: "Weet je zeker dat je deze relatie wilt verwijderen?" });

// --- Members (Relaties waar is_member = true) ---
export const { useList: useMembers, useOne: useMember, useCreate: useCreateMember, useUpdate: useUpdateMember, useDelete: useDeleteMember, useDeleteWithConfirm: useDeleteMemberWithConfirm } =
  createResourceHooks('members', {
    getList: (page, perPage, options) => {
      const filter = options.filter ? `(${options.filter}) && (is_member = true)` : "is_member = true";
      return getRelations(page, perPage, { ...options, filter });
    },
    getOne: getRelation,
    create: (data) => createRelation({ ...data, is_member: true }),
    update: updateRelation,
    remove: deleteRelation,
  }, { listOptions: { staleTime: 30 * 1000 }, confirmMessage: "Weet je zeker dat je dit lid wilt verwijderen?" });

export function useBulkCreateRelations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkCreateRelations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relations'] });
    },
  });
}

// --- Finance: Fiscal Years ---
export const { useList: useFiscalYears, useOne: useFiscalYear, useCreate: useCreateFiscalYear, useUpdate: useUpdateFiscalYear, useDelete: useDeleteFiscalYear, useDeleteWithConfirm: useDeleteFiscalYearWithConfirm } =
  createResourceHooks('fiscalYears', {
    getList: getFiscalYears,
    getOne: getFiscalYear,
    create: createFiscalYear,
    update: updateFiscalYear,
    remove: deleteFiscalYear,
  }, { confirmMessage: "Weet je zeker dat je dit boekjaar wilt verwijderen?" });

// --- Finance: Ledger Accounts ---
export const { useList: useLedgerAccounts, useOne: useLedgerAccount, useCreate: useCreateLedgerAccount, useUpdate: useUpdateLedgerAccount, useDelete: useDeleteLedgerAccount, useDeleteWithConfirm: useDeleteLedgerAccountWithConfirm } =
  createResourceHooks('ledgerAccounts', {
    getList: getLedgerAccounts,
    getOne: getLedgerAccount,
    create: createLedgerAccount,
    update: updateLedgerAccount,
    remove: deleteLedgerAccount,
  }, { confirmMessage: "Weet je zeker dat je deze grootboekrekening wilt verwijderen?" });

// --- Finance: Journal Transactions ---
export const { useList: useJournalTransactions, useOne: useJournalTransaction, useCreate: useCreateJournalTransaction, useUpdate: useUpdateJournalTransaction, useDelete: useDeleteJournalTransaction, useDeleteWithConfirm: useDeleteJournalTransactionWithConfirm } =
  createResourceHooks('journalTransactions', {
    getList: getJournalTransactions,
    getOne: getJournalTransaction,
    create: createJournalTransaction,
    update: updateJournalTransaction,
    remove: deleteJournalTransaction,
  }, { confirmMessage: "Weet je zeker dat je deze boeking wilt verwijderen?" });

// --- Finance: Sales Invoices ---
export const { useList: useSalesInvoices, useOne: useSalesInvoice, useCreate: useCreateSalesInvoice, useUpdate: useUpdateSalesInvoice, useDelete: useDeleteSalesInvoice, useDeleteWithConfirm: useDeleteSalesInvoiceWithConfirm } =
  createResourceHooks('salesInvoices', {
    getList: getSalesInvoices,
    getOne: getSalesInvoice,
    create: createSalesInvoice,
    update: updateSalesInvoice,
    remove: deleteSalesInvoice,
  }, { confirmMessage: "Weet je zeker dat je deze verkoopfactuur wilt verwijderen?" });

// --- Finance: Bank Statement Lines ---
export const { useList: useBankStatementLines, useOne: useBankStatementLine, useCreate: useCreateBankStatementLine, useUpdate: useUpdateBankStatementLine, useDelete: useDeleteBankStatementLine, useDeleteWithConfirm: useDeleteBankStatementLineWithConfirm } =
  createResourceHooks('bankStatementLines', {
    getList: getBankStatementLines,
    getOne: getBankStatementLine,
    create: createBankStatementLine,
    update: updateBankStatementLine,
    remove: deleteBankStatementLine,
  }, { confirmMessage: "Weet je zeker dat je deze bankafschriftregel wilt verwijderen?" });

export function useBulkCreateBankStatementLines() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lines, options }) => bulkCreateBankStatementLines(lines, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankStatementLines'] });
    },
  });
}

export function useAllLedgerAccounts(options = {}) {
  return useQuery({
    queryKey: ['ledgerAccounts', 'all', options],
    queryFn: () => getAllLedgerAccounts({ sort: "account_number", ...options }),
  });
}

export function useAllRelations(options = {}) {
  return useQuery({
    queryKey: ['relations', 'all', options],
    queryFn: () => getAllRelations(options),
  });
}

export function useAllInvoices(options = {}) {
  return useQuery({
    queryKey: ['invoices', 'all', options],
    queryFn: () => getAllInvoices(options),
  });
}

export function useAllBatchRuns(options = {}) {
  return useQuery({
    queryKey: ['batchRuns', 'all', options],
    queryFn: () => getAllBatchRuns({ sort: "-run_date", ...options }),
  });
}

// --- Finance: Batch Runs ---
export const { useList: useBatchRuns, useOne: useBatchRun, useCreate: useCreateBatchRun, useUpdate: useUpdateBatchRun, useDelete: useDeleteBatchRun, useDeleteWithConfirm: useDeleteBatchRunWithConfirm } =
  createResourceHooks('batchRuns', {
    getList: getBatchRuns,
    getOne: getBatchRun,
    create: createBatchRun,
    update: updateBatchRun,
    remove: deleteBatchRun,
  }, { confirmMessage: "Weet je zeker dat je deze batchrun wilt verwijderen?" });

// --- Parameters ---
export const { useList: useParameters, useOne: useParameter, useCreate: useCreateParameter, useUpdate: useUpdateParameter, useDelete: useDeleteParameter, useDeleteWithConfirm: useDeleteParameterWithConfirm } =
  createResourceHooks('parameters', {
    getList: getParametersPage,
    getOne: getParameter,
    create: createParameter,
    update: updateParameter,
    remove: deleteParameter,
  }, { confirmMessage: "Weet je zeker dat je deze parameter wilt verwijderen?" });

// --- Emails ---
const { useList: useEmails, useOne: useEmail, useCreate: useCreateEmail, useUpdate: useUpdateEmail, useDelete: useDeleteEmail, useDeleteWithConfirm: useDeleteEmailWithConfirm } =
  createResourceHooks('emails', {
    getList: getEmails,
    getOne: getEmail,
    create: createEmail,
    update: updateEmail,
    remove: deleteEmail,
  }, { confirmMessage: "Weet je zeker dat je deze e-mail wilt verwijderen?" });

export { useEmails, useEmail, useCreateEmail, useUpdateEmail, useDeleteEmail, useDeleteEmailWithConfirm };

// --- Mailings ---
export const { useList: useMailings, useOne: useMailing, useCreate: useCreateMailing, useUpdate: useUpdateMailing, useDelete: useDeleteMailing, useDeleteWithConfirm: useDeleteMailingWithConfirm } =
  createResourceHooks('mailings', {
    getList: (_, __, options) => getMailings(options),
    getOne: getMailing,
    create: createMailing,
    update: updateMailing,
    remove: deleteMailing,
  }, { confirmMessage: "Weet je zeker dat je deze mailing wilt verwijderen?" });

// --- Email Templates ---
export const { useList: useEmailTemplates, useOne: useEmailTemplate, useCreate: useCreateEmailTemplate, useUpdate: useUpdateEmailTemplate, useDelete: useDeleteEmailTemplate, useDeleteWithConfirm: useDeleteEmailTemplateWithConfirm } =
  createResourceHooks('emailTemplates', {
    getList: (_, __, options) => getEmailTemplates(options),
    getOne: getEmailTemplate,
    create: createEmailTemplate,
    update: updateEmailTemplate,
    remove: deleteEmailTemplate,
  }, { confirmMessage: "Weet je zeker dat je dit e-mailtemplate wilt verwijderen?" });

// --- Mailing Template Blocks ---
export const { useList: useMailingTemplateBlocks, useOne: useMailingTemplateBlock, useCreate: useCreateMailingTemplateBlock, useUpdate: useUpdateMailingTemplateBlock, useDelete: useDeleteMailingTemplateBlock, useDeleteWithConfirm: useDeleteMailingTemplateBlockWithConfirm } =
  createResourceHooks('mailingTemplateBlocks', {
    getList: (_, __, options) => getMailingTemplateBlocks(options),
    getOne: getMailingTemplateBlock,
    create: createMailingTemplateBlock,
    update: updateMailingTemplateBlock,
    remove: deleteMailingTemplateBlock,
  }, { confirmMessage: "Weet je zeker dat je dit blok wilt verwijderen?" });

// --- Mailing Blocks ---
export const { useList: useMailingBlocks, useOne: useMailingBlock, useCreate: useCreateMailingBlock, useUpdate: useUpdateMailingBlock, useDelete: useDeleteMailingBlock, useDeleteWithConfirm: useDeleteMailingBlockWithConfirm } =
  createResourceHooks('mailingBlocks', {
    getList: (_, __, options) => getMailingBlocks(options),
    getOne: getMailingBlock,
    create: createMailingBlock,
    update: updateMailingBlock,
    remove: deleteMailingBlock,
  }, { confirmMessage: "Weet je zeker dat je dit blok wilt verwijderen?" });

// --- Settings ---
export const { useList: useSettings, useOne: useSetting, useCreate: useCreateSetting, useUpdate: useUpdateSetting, useDelete: useDeleteSetting, useDeleteWithConfirm: useDeleteSettingWithConfirm } =
  createResourceHooks('settings', {
    getList: getSettings,
    getOne: getSetting,
    create: createSetting,
    update: updateSetting,
    remove: deleteSetting,
  }, { confirmMessage: "Weet je zeker dat je deze instelling wilt verwijderen?" });

// --- Media Files ---
export const { useList: useMediaFiles, useOne: useMediaFile, useCreate: useCreateMediaFile, useUpdate: useUpdateMediaFile, useDelete: useDeleteMediaFile, useDeleteWithConfirm: useDeleteMediaFileWithConfirm } =
  createResourceHooks('mediaFiles', {
    getList: getMediaFilesPage,
    getOne: getMediaFile,
    create: createMediaFile,
    update: updateMediaFile,
    remove: deleteMediaFile,
  }, { confirmMessage: "Weet je zeker dat je dit bestand wilt verwijderen?" });
