import { useUser } from "@/context/User"
import {
  COLLECT_ORDER,
  DISPATCH_ORDER,
  GET_ALL_ORDERS,
  GET_AVAILABLE_DEVICES_IMEI,
} from "@/lib/request"
import { Badge, Button, Modal, Popover, Select, Table } from "@mantine/core"
import { useViewportSize } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconCheck, IconExclamationMark } from "@tabler/icons-react"
import { AgGridReact } from "ag-grid-react"
import moment from "moment"
import Link from "next/link"
import React, { useEffect, useState } from "react"
import { useMutation, useQuery } from "urql"

function Orders() {
  const { height } = useViewportSize()
  const { user } = useUser()

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_ALL_ORDERS,
  })

  const LaunchMap = ({ data }) => {
    return (
      <div className="flex space-x-3 align-bottom">
        <p>{data?.saleInfo?.customer?.shipping?.town}</p>

        {data?.saleInfo?.delivery?.lat?.trim() !== "" &&
          data?.saleInfo?.delivery?.lng?.trim() !== "" && (
            <Link
              className="underline text-[0.7rem]"
              href={`https://www.google.com/maps/dir/?api=1&destination=${data?.saleInfo?.delivery?.lat}%2C${data?.saleInfo?.delivery?.lng}`}
            >
              See on map
            </Link>
          )}
      </div>
    )
  }

  const MoreRender = ({ data }) => {
    let status =
      !data?.saleInfo?.delivery?.collectionTime &&
      !data?.saleInfo?.delivery?.dispatchTime
        ? "NEW"
        : !data?.saleInfo?.delivery?.collectionTime &&
          data?.saleInfo?.delivery?.dispatchTime
        ? "DISPATCHED"
        : data?.saleInfo?.delivery?.collectionTime && "COLLECTED"

    // Dispatch
    const [dispatchOpen, setDispatchOpen] = useState(false)
    const [loadingDispatch, setLoadingDispatch] = useState(false)

    const [selectedDevice, setSelectedDevice] = useState("")

    const [{ data: deviceData }, reexecuteQuery] = useQuery({
      query: GET_AVAILABLE_DEVICES_IMEI,
      variables: {
        variant: data?.variant?.id,
        storage: data?.storage,
        color: data?.color,
      },
      requestPolicy: "network-only",
    })

    const [_, _dispatchOrder] = useMutation(DISPATCH_ORDER)

    const handleDispatch = () => {
      if (!selectedDevice && !data?.device?.imei) {
        notifications.show({
          title: "Missing IMEI",
          color: "orange",
          message:
            "Ensure you have selected an IMEI for the device you want to dispatch",
        })

        return
      }
      setLoadingDispatch(true)

      _dispatchOrder({
        deviceId: !data?.device?.id ? selectedDevice : data?.device?.id,
        orderId: data?.id,
      })
        .then(({ data, error }) => {
          if (data) {
            notifications.show({
              title: "Device marked as dispatched",
              color: "green",
              icon: <IconCheck />,
            })
            setDispatchOpen(false)
            reexecuteQuery()
          } else {
            notifications.show({
              title: "An error occured",
              color: "red",
              icon: <IconExclamationMark />,
            })
          }
        })
        .finally(() => {
          setLoadingDispatch(false)
        })
    }

    // Collect
    const [__, _collectOrder] = useMutation(COLLECT_ORDER)
    const [loadingCollect, setLoadingCollect] = useState(false)

    const handleCollection = () => {
      setLoadingCollect(true)

      _collectOrder({
        orderId: data?.id,
      }).then(({ data, error }) => {
        reexecuteQuery()
      })
    }

    if (status === "COLLECTED") return

    if (!user?.adminRights?.includes("UPDATE_ORDER")) return

    if (status === "NEW")
      return (
        <div className="flex items-center space-x-1 p-1">
          <Button
            size="xs"
            onClick={() => {
              if (data?.device?.id) {
                handleDispatch()
              } else {
                setDispatchOpen(true)
              }
            }}
          >
            Dispatch
          </Button>

          <Modal
            centered
            opened={dispatchOpen}
            onClose={() => setDispatchOpen(false)}
            title={<strong>Available devices</strong>}
          >
            {deviceData?.getAvailableDevices?.length > 0 ? (
              <div className="space-y-2 p-2">
                <Select
                  placeholder="Device"
                  label="IMEI"
                  onChange={(selection) => {
                    setSelectedDevice(selection)
                  }}
                  value={selectedDevice}
                  data={deviceData?.getAvailableDevices?.map(
                    ({ imei, id, metadata }) => ({
                      label: `${imei} (${
                        metadata?.isRepaired
                          ? "Ready for dispatch"
                          : "Pending repairs"
                      })`,
                      value: id,
                    })
                  )}
                />

                <Button
                  loading={loadingDispatch}
                  disabled={loadingDispatch}
                  fullWidth
                  onClick={handleDispatch}
                >
                  Dispatch
                </Button>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                <p>
                  Device options not found in the inventory. Add a new device in
                  the inventory tab
                </p>
              </div>
            )}
          </Modal>
        </div>
      )

    if (status === "DISPATCHED")
      return (
        <div className="flex items-center space-x-1 p-1">
          <Popover width={300} position="bottom" withArrow shadow="md">
            <Popover.Target>
              <Button size="xs" onClick={() => setDispatchOpen(true)}>
                Order collected
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <div className="space-y-2 p-2">
                <strong>Confirm collection</strong>
                <p className="text-slate-500">
                  Ensure this product has been collected by the client before
                  confirming using the button below. This action is
                  irreversible.
                </p>

                <Button fullWidth size="xs" onClick={handleCollection}>
                  Confirm collection
                </Button>
              </div>
            </Popover.Dropdown>
          </Popover>
        </div>
      )
  }

  // AG grid column definitions
  const colDefs = [
    {
      headerName: "Customer name",

      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) => data?.saleInfo?.customer?.name,
    },
    {
      headerName: "Customer phone",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) =>
        data?.saleInfo?.customer?.phoneNumber ||
        data?.saleInfo?.payment?.phoneNumber,
    },
    {
      headerName: "Date",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) =>
        moment(new Date(parseInt(data?.saleInfo?.payment?.timestamp))).format(
          "Do MMM YYYY"
        ),
    },
    {
      headerName: "IMEI/Identifier",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) => data?.device?.imei,
      valueFormatter: ({ data }) => {
        if (data?.device?.imei && data?.device?.offer?.info?.label) {
          return `${data?.device?.imei} (${data?.device?.offer?.info?.label})`
        } else if (!data?.device?.offer?.info?.label && data?.imei) {
          return `${data?.device?.imei}`
        } else {
          return
        }
      },
    },
    {
      headerName: "Model",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) => data?.variant?.model,
    },
    {
      headerName: "Compliments",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) => data?.saleInfo?.compliments,
    },
    {
      headerName: "Storage/Label",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) =>
        data?.variant?.storages?.find(
          (storage) => storage["id"] == data?.storage
        )?.label,
    },
    {
      headerName: "Color",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) =>
        data?.variant?.colors?.find((color) => color["id"] == data?.color)
          ?.label,
    },
    {
      headerName: "Transaction Code",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) => data?.saleInfo?.payment?.codes,
    },
    {
      headerName: "Payment",
      filter: true,
      floatingFilter: true,
      valueGetter: ({ data }) => data?.saleInfo?.payment?.amount,
      valueFormatter: ({ data }) =>
        "Ksh." + data?.saleInfo?.payment?.amount?.toLocaleString("en-US"),
    },
    {
      headerName: "Delivery location",
      valueGetter: ({ data }) => data?.saleInfo?.customer?.shipping?.town,
      cellRenderer: LaunchMap,
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Status",
      filter: true,
      width: 150,
      pinned: "right",
      floatingFilter: true,
      valueGetter: ({ data }) =>
        !data?.saleInfo?.delivery?.collectionTime &&
        !data?.saleInfo?.delivery?.dispatchTime
          ? "NEW"
          : !data?.saleInfo?.delivery?.collectionTime &&
            data?.saleInfo?.delivery?.dispatchTime
          ? "DISPATCHED"
          : data?.saleInfo?.delivery?.collectionTime && "COLLECTED",
      cellRenderer: ({ value }) =>
        value == "NEW" ? (
          <Badge color="blue" className="mt-[10px]" radius={"sm"}>
            NEW
          </Badge>
        ) : value == "DISPATCHED" ? (
          <Badge color="orange" className="mt-[10px]" radius={"sm"}>
            {" "}
            DISPATCHED
          </Badge>
        ) : (
          <Badge color="green" className="mt-[10px]" radius={"sm"}>
            COMPLETED
          </Badge>
        ),
    },
    {
      field: "",
      width: 140,
      pinned: "right",
      cellRenderer: MoreRender,
    },
  ]

  return (
    <div className="bg-slate-100 p-8 w-full h-screen">
      <h1 className="text-xl font-bold">Website orders</h1>
      <br />

      <div
        className="ag-theme-quartz mt-4" // applying the Data Grid theme
        style={{ height: height - 120 }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact rowData={data?.getAllOrders} columnDefs={colDefs} />
      </div>
    </div>
  )
}

export default Orders
