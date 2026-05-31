export default function actionsMenuItems({ handleSetState, handleConfirmState, selectedRowKeys, updating }) {
  return [
    {
      key: "present",
      label: "Set selected present",
      disabled: selectedRowKeys.length === 0 || updating,
    },
    {
      key: "not_present",
      label: "Set selected not present",
      disabled: selectedRowKeys.length === 0 || updating,
    },
    {
      type: "divider",
    },
    {
      key: "confirm",
      label: "Confirm status",
      disabled: updating,
    },
  ];
}

