import { useUser } from "@/context/User";
import {
  APPROVE_FINANCING_REQUEST,
  CANCEL_FINANCING_REQUEST,
  GET_FINANCE_REQUESTS,
} from "@/lib/request";
import {
  Badge,
  Button,
  Code,
  Modal,
  NumberInput,
  Popover,
  Select,
  TagsInput,
} from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { AgGridReact } from "ag-grid-react";
import moment from "moment";
import React, { useState } from "react";
import { useMutation, useQuery } from "urql";

function Requests() {
  const { height } = useViewportSize();
  const { user } = useUser();

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_FINANCE_REQUESTS,
  });

  const MoreRender = ({ data }) => {
    // Approving request
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [loadingApprove, setLoadingApprove] = useState(false);

    const [sale, setSale] = useState({
      txCodes: [],
      paymentMode: "",
      amount: null,
    });

    const [__, _approveRequest] = useMutation(APPROVE_FINANCING_REQUEST);

    const handleClosePayment = () => {
      setSale({
        txCodes: [],
        paymentMode: "",
      });
      setPaymentModalOpen(false);
    };

    const handleApproval = () => {
      if (
        (sale?.paymentMode == "MPESA" && sale?.txCodes.length < 1) ||
        !sale?.amount ||
        !sale?.paymentMode
      ) {
        notifications.show({
          title: "Missing required fields",
          message: "Ensure appopriate fields are filled before approving",
          color: "orange",
        });
        return;
      }
      setLoadingApprove(true);

      _approveRequest({
        request: data?.id,
        ...sale,
      })
        .then(({ data, error }) => {
          if (data && !error) {
            notifications.show({
              title: "Request approved",
              color: "green",
            });

            handleClosePayment();

            reexecuteQuery();
          } else {
            notifications.show({
              title: "Approval failed",
              color: "red",
            });
          }
        })
        .catch((err) => {
          notifications.show({
            title: "Approval failed",
            color: "red",
          });
        })
        .finally(() => {
          setLoadingApprove(false);
        });
    };

    // Cancelling request
    const [loadingCancel, setLoadingCancel] = useState(false);

    const [_, _cancelRequest] = useMutation(CANCEL_FINANCING_REQUEST);

    const handleCancellation = () => {
      setLoadingCancel(true);

      _cancelRequest({
        request: data?.id,
      })
        .then(({ data, error }) => {
          if (data && !error) {
            notifications.show({
              title: "Request cancelled",
              color: "orange",
            });

            reexecuteQuery();
          } else {
            notifications.show({
              title: "Cancellation failed",
              color: "red",
            });
          }
        })
        .catch((err) => {
          notifications.show({
            title: "Cancellation failed",
            color: "red",
          });
        })
        .finally(() => {
          setLoadingCancel(false);
        });
    };

    if (data?.status != "PROCESSING") return;

    if (!user?.adminRights?.includes("APPROVE_FINANCINGS")) return;

    return (
      <div className="flex items-center space-x-1 p-1">
        <Button.Group>
          <Button size="xs" onClick={() => setPaymentModalOpen(true)}>
            Approve
          </Button>

          <Modal
            centered
            opened={paymentModalOpen}
            title={<strong>Payment Information</strong>}
            onClose={handleClosePayment}
          >
            <div className="p-4 space-y-4">
              <NumberInput
                label="Amount paid"
                value={sale?.amount}
                onChange={(val) => setSale({ ...sale, amount: val })}
                thousandSeparator=","
                prefix="Ksh."
                min={0}
              />

              <Select
                required
                value={sale?.paymentMode}
                onChange={(selection) =>
                  setSale((_sale) => ({ ..._sale, paymentMode: selection }))
                }
                withAsterisk
                label="Payment mode"
                radius="md"
                data={["MPESA", "CASH"]}
                searchable
              />

              <TagsInput
                data={[]}
                label="Transaction codes"
                value={sale?.txCodes}
                onChange={(txCodes) => {
                  setSale((_sale) => ({
                    ..._sale,
                    txCodes,
                  }));
                }}
              />
              <br />

              <Button
                fullWidth
                onClick={handleApproval}
                loading={loadingApprove}
                disabled={loadingApprove}
              >
                Approve request
              </Button>
            </div>
          </Modal>

          <Popover width={300} position="bottom" withArrow shadow="md">
            <Popover.Target>
              <Button size="xs" color="red">
                Cancel
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <div className="space-y-2 p-2">
                <strong>Confirm cancellation</strong>
                <p className="text-slate-500">
                  Are you sure you want to cancel this request. This action is
                  irreversible.
                </p>

                <Button
                  loading={loadingCancel}
                  disabled={loadingCancel}
                  fullWidth
                  size="xs"
                  onClick={handleCancellation}
                >
                  I confirm
                </Button>
              </div>
            </Popover.Dropdown>
          </Popover>
        </Button.Group>
      </div>
    );
  };

  // AG grid column definitions
  const colDefs = [
    {
      headerName: "Customer name",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) => data?.customer?.name,
    },
    {
      headerName: "Customer phone",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) => data?.customer?.phoneNumber,
    },
    {
      headerName: "Customer location",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) => data?.customer?.shipping?.town,
    },
    {
      headerName: "Date",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) =>
        moment(new Date(parseInt(data?.date))).format("Do MMM YYYY"),
    },
    {
      headerName: "Model",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) => data?.device?.variant?.model,
    },
    {
      headerName: "Storage",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) =>
        data?.device?.variant?.storages?.find(
          ({ id }) => data?.device?.storage == id
        )?.label,
    },
    {
      headerName: "Color",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) =>
        data?.device?.variant?.colors?.find(
          ({ id }) => data?.device?.color == id
        )?.label,
    },

    {
      headerName: "Price",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) =>
        data?.device?.variant?.storages?.find(
          ({ id }) => data?.device?.storage == id
        )?.price,
      valueFormatter: ({ value }) => "Ksh." + value.toLocaleString("en-US"),
    },

    {
      headerName: "Financer",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) => data?.financer,
      cellRenderer: ({ value }) => (
        <Code>{value == "buySimu" ? "BUY SIMU" : "CHANTEQ"}</Code>
      ),
    },

    {
      headerName: "Status",
      filter: true,
      pinned: "right",
      floatingFilter: true,
      valueGetter: ({ data }) =>
        data?.status == "PROCESSING" ? "NEW" : data?.status,
      cellRenderer: ({ value }) =>
        value == "NEW" ? (
          <Badge color="blue" className="mt-[10px]" radius={"sm"}>
            NEW
          </Badge>
        ) : value == "APPROVED" ? (
          <Badge color="green" className="mt-[10px]" radius={"sm"}>
            APPROVED
          </Badge>
        ) : value == "CANCELLED" ? (
          <Badge color="red" className="mt-[10px]" radius={"sm"}>
            CANCELLED
          </Badge>
        ) : null,
    },
    {
      field: "",
      cellRenderer: MoreRender,
      pinned: "right",
    },
  ];

  return (
    <div className="bg-slate-100 p-8 w-full h-screen">
      <h1 className="text-xl font-bold">Financing requests</h1>
      <br />

      <div
        className="ag-theme-quartz mt-4" // applying the Data Grid theme
        style={{ height: height - 130 }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact
          rowData={data?.getAllFinancingRequests}
          columnDefs={colDefs}
        />
      </div>
    </div>
  );
}

export default Requests;
