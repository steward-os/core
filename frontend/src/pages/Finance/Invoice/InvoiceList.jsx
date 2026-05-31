import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../../components/Button";
import CenteredAlert from "../../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../../components/List";
import { ListView } from "../../../components/List/ListView";
import { useDeleteSalesInvoice, useDeleteSalesInvoiceWithConfirm, useSalesInvoices } from "../../../hooks/crudResourceHooks";
import { buildFetchOptions } from "../../../hooks/utils/useColumnFilters";
import { HEADER_COLUMNS } from "./invoiceConstants";

const InvoiceList = ({ config }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState({ sortField: "created", sortDirection: "desc", filters: {} });

  const queryOptions = buildFetchOptions(query, HEADER_COLUMNS, { expand: "fi_invoice_lines(invoice),relation" }, [
    `type = "${config.type}"`,
  ]);
  const { data, isLoading, error } = useSalesInvoices(1, 100, queryOptions);
  const handleDelete = useDeleteSalesInvoiceWithConfirm();
  const { mutateAsync: deleteInvoice } = useDeleteSalesInvoice();

  const handleBulkDelete = async (selectedIds) => {
    await Promise.all(Array.from(selectedIds).map((id) => deleteInvoice(id)));
  };

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          <AddButton
            onClick={() => navigate(`${config.basePath}/new?${searchParams.toString()}`)}
            ariaLabel={config.addAriaLabel}
          />
        }
      >
        {config.listTitle}
      </ListHeading>

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <ListView
          data={data?.items || []}
          totalItems={data?.totalItems || 0}
          headerColumns={HEADER_COLUMNS}
          defaultSortField="created"
          defaultSortDirection="desc"
          emptyMessage={config.emptyMessage}
          onClick={(item) => navigate(`${config.basePath}/${item.id}?${searchParams.toString()}`)}
          onEdit={(item) => navigate(`${config.basePath}/${item.id}/edit?${searchParams.toString()}`)}
          onDelete={handleDelete}
          onQueryChange={setQuery}
          enableSelection={true}
          onBulkDelete={handleBulkDelete}
          bulkDeleteText="Verwijder geselecteerde facturen"
        />
      )}
    </ListContainer>
  );
};

export default InvoiceList;
