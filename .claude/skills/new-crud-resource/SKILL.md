---
name: new-crud-resource
description: Scaffold a complete CRUD resource in frontend/. Creates List, Detail, and Edit pages plus service, Zod schema, hooks, routes, and navigation entry. Use when the user wants to add a new resource type to the Fanfare Tools app.
argument-hint: [ResourceName]
allowed-tools: Read, Edit, Write, Bash
---

You are scaffolding a new CRUD resource for the Fanfare Tools `frontend` React app.
All source files live under `frontend/src/` relative to the repo root.

## Step 1 — Ask these questions (all at once, in a single message)

Do NOT start generating code until you have answers to all questions below.

---

**1. Resource name**
PascalCase singular — e.g. `Meeting`, `Project`, `Instrument`.
(Used for component names, file names, hook names.)

**2. PocketBase collection name**
e.g. `mb_meetings`. Check `frontend/src/services/` for existing naming conventions.

**3. Base URL path**
e.g. `/meetings`. Used for routes and navigation links.

**4. Dutch label (plural)**
Shown in the nav sidebar and page headings — e.g. `Vergaderingen`, `Projecten`.

**5. Navigation section**
Where should it appear in the sidebar? Options from `frontend/src/utils/navigation.js`:
- `Beheer` — admin (`leden_app_admin`)
- `Bestuur` — board member (`is_board_member`)
- `Planning` — session admin (`is_session_admin`)
- `Financieel` — finance admin (`is_finance_admin`)
- New section (give the section name and the required role field on `pb.authStore.record`)

**6. Admin role**
Which role field on `pb.authStore.record` gates the edit/delete/add actions?
e.g. `leden_app_admin`, `is_session_admin`, `is_board_member`, `is_finance_admin`.
If the list is public (all logged-in users can view), say so — the prop will default to `false`.

**7. Fields**
List every field as a table or bullet list with these columns:
- **name** — JS/PocketBase field name (snake_case)
- **type** — `text` | `textarea` | `number` | `date` | `datetime` | `select` | `checkbox` | `relation`
- **Dutch label** — shown next to the field
- **required** — yes/no
- For `select`: list the option values and labels
- For `relation`: the related PocketBase collection and display field (e.g. `mb_groups → name`)

---

## Step 2 — Read reference files before generating

Before writing any code, read these files to internalize exact patterns:

- `frontend/src/pages/Meeting/MeetingList.jsx`
- `frontend/src/pages/Meeting/MeetingDetail.jsx`
- `frontend/src/pages/Meeting/MeetingEdit.jsx`
- `frontend/src/services/meetingService.js`
- `frontend/src/schemas/meetingSchema.js`
- `frontend/src/hooks/crudResourceHooks.js` (find the Meeting block)
- `frontend/src/utils/navigation.js`
- `frontend/src/App.jsx` (imports + routes section for meetings)

---

## Step 3 — Generate all files

Use the variable names from the answers. Below, `<Resource>` = PascalCase name, `<resource>` = camelCase, `<resources>` = camelCase plural, `<collection>` = PocketBase collection name, `<path>` = base URL path, `<label>` = Dutch label.

### CREATE these files:

**A. `frontend/src/services/<resource>Service.js`**
Export these functions (pure PocketBase ops, no React state):
```
get<Resource>(id, options = {})           → pb.collection('<collection>').getOne(id, options)
get<Resource>s(page, perPage, options={}) → pb.collection('<collection>').getList(page, perPage, options)
getAll<Resource>s(options = {})           → pb.collection('<collection>').getFullList(options)
create<Resource>(data)                    → pb.collection('<collection>').create(data)
update<Resource>(id, data)                → pb.collection('<collection>').update(id, data)
delete<Resource>(id)                      → pb.collection('<collection>').delete(id)
```

**B. `frontend/src/schemas/<resource>Schema.js`**
Zod schema for all fields. Required text fields: `z.string().min(1, "... is verplicht")`. Optional: `.optional()`. Numbers: `z.coerce.number()`. Datetimes: `z.string().min(1, "...")`. Checkboxes: `z.boolean().optional()`. Relation (multi): `z.array(z.string())`. Relation (single): `z.string().optional()`.

**C. `frontend/src/pages/<Resource>/<Resource>List.jsx`**

Follow this structure exactly:
- `HEADER_COLUMNS` array — include the most important 2–4 fields. Each entry: `{ label, width, field, sortable, mobilePosition: "title"|"info", render?, filter? }`
- `usePagination(50)` for pagination state
- `useSmartTagFilter({ query, headerColumns: HEADER_COLUMNS, baseOptions, extraConditions: [] })` for filter/sort
- `use<Resource>s(currentPage, perPage, queryOptions)` for data
- `useDelete<Resource>WithConfirm()` for delete
- `ListView` component with `data`, `totalItems`, `headerColumns`, `defaultSortField`, `emptyMessage`, `onClick`, conditional `onEdit` and `onDelete` gated on admin prop
- `SimplePaginator` at the bottom
- `AddButton` in `ListHeading` gated on admin prop, navigates to `<path>/new`
- Row click navigates to `<path>/${item.id}` — both with `?${searchParams.toString()}`
- `useEffect` resets to page 1 on query/filter change

**D. `frontend/src/pages/<Resource>/<Resource>Detail.jsx`**

Follow this structure exactly:
- `useState` for data and loading
- `useEffect` calls service `get<Resource>(id)` directly (not the hook) for simplicity
- `PageContent` > `PageHeader` (with `BackButton`, and admin-gated `EditButton` + `DeleteButton`)
- `DetailCard` > `DetailBlock` > `Row` + `Label` + `Value` for each field
- Format dates with `formatDateTime` from `../../utils/dateTimeUtils`
- Delete handler: `window.confirm(...)` then `delete<Resource>Mutation.mutateAsync(id)` then navigate to list
- Loading state: `<CenteredSpinner />`; not-found state: `<CenteredAlert text="<Resource> niet gevonden." />`
- Navigation always preserves `?${searchParams.toString()}`

**E. `frontend/src/pages/<Resource>/<Resource>Edit.jsx`**

Follow this structure exactly:
- `isCreateMode = !id`
- `useForm({ resolver: zodResolver(<resource>Schema), defaultValues: { ...all fields with empty defaults } })`
- `useEffect` on `id` — for edit mode: fetch record and `form.reset({...data})`. Convert `datetime` fields with `dayjs(val).format("YYYY-MM-DDTHH:mm")`. For create mode: just stop loading.
- For `relation` fields: fetch the related collection in a `try/catch` and populate options state
- Layout: `PageContent` > `PageHeader` (title = record name or "Nieuwe <label>" if create) with `CloseButton`
- `DetailCard` > `DetailBlock` > `Row` + `Label` per field
- Field components: `Input` (text/number/date/datetime), `Select` (select/relation-single), checkboxes (inline), `Textarea` (textarea), checkbox grid for multi-relation
- `onSubmit`: build data object (convert datetime back with `dayjs(val).toISOString()`), call create or update mutation, navigate to detail or list on success
- Bottom buttons: Cancel (`color="gray"`) and Save (`color="blue"`, `disabled={isPending}`)
- Loading/not-found states same as Detail

---

### UPDATE these files:

**F. `frontend/src/hooks/crudResourceHooks.js`**

Add a block following the existing Meeting or Session pattern:
```js
export const {
  useList: use<Resource>s,
  useOne: use<Resource>,
  useCreate: useCreate<Resource>,
  useUpdate: useUpdate<Resource>,
  useDelete: useDelete<Resource>,
  useDeleteWithConfirm: useDelete<Resource>WithConfirm,
} = createResourceHooks('<resources>', {
  getList: get<Resource>s,
  getOne: get<Resource>,
  create: create<Resource>,
  update: update<Resource>,
  remove: delete<Resource>,
}, {
  listOptions: { staleTime: 30 * 1000 },
  confirmMessage: "Weet je zeker dat je deze <label> wilt verwijderen?",
});
```
Add the import for the service functions at the top of the file.

**G. `frontend/src/utils/navigation.js`**

Add an entry to the correct array (`adminMenuItems`, `boardMenuItems`, `sessionMenuItems`, `financeMenuItems`):
```js
{ key: "<resource>", label: "<label>", path: "<path>", <roleFlag>: true },
```
where `<roleFlag>` matches the existing pattern (`adminPage`, `boardMemberPage`, `sessionAdminPage`, `financePage`).
Also add the path to `allMenuItemPaths`.

**H. `frontend/src/App.jsx`**

1. Add three import lines near the existing similar imports:
```js
import <Resource>List from "./pages/<Resource>/<Resource>List";
import <Resource>Detail from "./pages/<Resource>/<Resource>Detail";
import <Resource>Edit from "./pages/<Resource>/<Resource>Edit";
```

2. Inside `<Routes>`, find the appropriate role-guarded block and add:
```jsx
<Route path="<path>" element={<<Resource>List is<RoleProp>={is<RoleProp>} />} />
<Route path="<path>/new" element={<<Resource>Edit />} />
<Route path="<path>/:id" element={<<Resource>Detail is<RoleProp>={is<RoleProp>} />} />
<Route path="<path>/:id/edit" element={<<Resource>Edit />} />
```

---

## Step 4 — Verify

After writing all files, run:
```
cd frontend && npm run lint 2>&1 | tail -20
```
Fix any reported errors before finishing.

## Step 5 — Summary

Print a checklist:
- [ ] Created: service, schema, List, Detail, Edit pages
- [ ] Updated: crudResourceHooks.js, navigation.js, App.jsx
- Next step for the user: add the PocketBase collection `<collection>` with the fields above, then run `npm run dev` to test.
