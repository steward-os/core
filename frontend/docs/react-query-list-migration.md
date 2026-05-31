# React Query List Migration Guide

This guide shows how to migrate existing ListView-based pages to use React Query with SimpleListView, using SessionList as the reference implementation.

## Step 1: Create Query Hooks

Create a hooks file for your collection (e.g., `src/hooks/useUserQuery.js`):

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../services/userService'

export function useUsers(page = 1, perPage = 50, options = {}) {
  return useQuery({
    queryKey: ['users', page, perPage, options],
    queryFn: () => getUsers(page, perPage, options),
    keepPreviousData: true,
  })
}

export function useUser(id, options = {}) {
  return useQuery({
    queryKey: ['users', id, options],
    queryFn: () => getUser(id, options),
    enabled: !!id,
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Add other mutations as needed...
```

## Step 2: Simplify Header Columns

Update your HEADER_COLUMNS to use the simplified format:

```javascript
const HEADER_COLUMNS = [
  {
    label: "Name",
    field: "name",
    sortable: true,
    filter: "name", // String = use field for filtering
  },
  {
    label: "Orchestra",
    field: "expand.orchestras.name",
    render: (user) => user.expand?.orchestras?.map(o => o.name).join(", ") || "",
    sortable: false,
    filter: (value) => `orchestras.name ~ "${value}"`, // Function = custom filter
  },
  {
    label: "", // Actions column
    width: "15%",
    sortable: false,
  },
];
```

**Key changes:**
- Remove `filterable: true/false` 
- Add `filter` property: string for simple field search, function for custom logic
- Remove `filter` property entirely if column shouldn't be filterable

## Step 3: Update the List Component

Replace the old ListView pattern with the new React Query pattern:

### Before (old ListView):
```javascript
const UserList = () => {
  return (
    <ListContainer>
      <ListHeading>Users</ListHeading>
      <ListView
        collectionName="users"
        headerColumns={HEADER_COLUMNS}
        // ... other props
      />
    </ListContainer>
  );
};
```

### After (React Query + SimpleListView):
```javascript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddButton } from "../../components/Button";
import { ListContainer, ListHeading } from "../../components/List";
import { SimpleListView } from "../../components/List/SimpleListView";
import CenteredAlert from "../../components/CenteredAlert";
import { useUsers, useDeleteUser } from "../../hooks/useUserQuery";
import { buildColumnFilterConditions } from "../../hooks/utils/useColumnFilters";
import { useListState } from "../../hooks/useListState";

const UserList = () => {
  const navigate = useNavigate();
  const { sortField, sortDirection, filters, handleSort, handleFilterChange } = useListState("name", "asc");
  
  // Build filter conditions
  const filterConditions = [];
  
  // Add your collection-specific filters here
  // Example: if (userType === "active") filterConditions.push("active = true");
  
  // Add generic column filters
  filterConditions.push(...buildColumnFilterConditions(filters, HEADER_COLUMNS));

  // Build query options
  const queryOptions = {
    expand: "orchestras", // Your expand options
    sort: sortDirection === "desc" ? `-${sortField}` : sortField,
    ...(filterConditions.length > 0 && {
      filter: filterConditions.join(' && ')
    })
  };

  // React Query hooks
  const { data, isLoading, error, isFetching } = useUsers(1, 100, queryOptions);
  const deleteUserMutation = useDeleteUser();

  // Delete handler
  const handleDelete = async (userId) => {
    if (window.confirm("Delete user?")) {
      try {
        await deleteUserMutation.mutateAsync(userId);
        return true;
      } catch (error) {
        console.error("Error deleting user:", error);
        return false;
      }
    }
    return false;
  };

  return (
    <ListContainer>
      <ListHeading button={<AddButton onClick={() => navigate("/users/new")} />}>
        Users {isFetching && <span className="text-xs text-gray-500 ml-2">(updating...)</span>}
      </ListHeading>

      {/* Add your collection-specific filters here */}
      
      {isLoading && <CenteredAlert text="Loading..." />}
      {error && <CenteredAlert text={`Error: ${error.message}`} />}
      {!isLoading && !error && (
        <SimpleListView
          data={data?.items || []}
          totalItems={data?.totalItems || 0}
          headerColumns={HEADER_COLUMNS}
          filters={filters}
          initialSortField={sortField}
          initialSortDirection={sortDirection}
          emptyMessage="No users found."
          onClick={(user) => navigate(`/users/${user.id}`)}
          onDelete={handleDelete}
          onSortChange={handleSort}
          onFilterChange={handleFilterChange}
          filterText="More filters..."
        />
      )}
    </ListContainer>
  );
};
```

## Step 4: Key Benefits You Get

- ⚡ **Automatic Caching** - Navigate away and back, instant loading
- 🔄 **Background Updates** - Fresh data without loading spinners  
- 🗑️ **Smart Invalidation** - Delete/update triggers automatic refresh
- 🔍 **Consistent Filtering** - Same behavior across all lists
- 📱 **Better UX** - Loading states, error handling, optimistic updates

## Step 5: Migration Checklist

For each list page:

- [ ] Create query hooks file (`useXxxQuery.js`)
- [ ] Simplify HEADER_COLUMNS (remove `filterable`, add `filter`)
- [ ] Replace ListView with SimpleListView + React Query hooks
- [ ] Add collection-specific filter logic if needed
- [ ] Update imports and error handling
- [ ] Test sorting, filtering, and CRUD operations

## Example Collections to Migrate

Based on your current codebase:
- `UserList` → `useUserQuery.js`
- `VolunteeringList` → `useVolunteeringQuery.js` 
- `MeetingList` → `useMeetingQuery.js`
- `BannerList` → `useBannerQuery.js`

Each follows the exact same pattern as SessionList!