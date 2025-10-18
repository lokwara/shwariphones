import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Code,
  ColorInput,
  ColorSwatch,
  Menu,
  Modal,
  MultiSelect,
  NumberInput,
  Select,
  Tabs,
  TagsInput,
  TextInput,
  Textarea,
} from "@mantine/core"
import React, { useState } from "react"
import { AgGridReact } from "ag-grid-react"
import { useViewportSize } from "@mantine/hooks"
import {
  IconCheck,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconExclamationCircle,
  IconExclamationCircleFilled,
  IconExclamationMark,
  IconPlus,
  IconUpload,
  IconX,
} from "@tabler/icons-react"
import { useMutation, useQuery } from "urql"
import {
  CREATE_DEVICE,
  CREATE_REPAIR,
  GET_DEVICES,
  GET_REPAIRS,
  GET_VARIANTS,
  UPDATE_REPAIR,
} from "@/lib/request"
import { notifications } from "@mantine/notifications"

import {
  CldImage,
  CldOgImage,
  CldUploadButton,
  CldUploadWidget,
} from "next-cloudinary"
import Image from "next/image"
import moment from "moment"
import { DateInput } from "@mantine/dates"
import { useUser } from "@/context/User"

function Repairs() {
  const { height } = useViewportSize()
  const { user } = useUser()

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_REPAIRS,
  })

  // AG grid renderers
  const Defect = ({ value }) => {
    return (
      <div className="space-x-1">
        {value?.map((defect, i) => (
          <Code key={i}>{defect}</Code>
        ))}
      </div>
    )
  }

  const MoreRender = ({ data }) => {
    const [modalOpened, setModalOpened] = useState(false)

    const [repair, setRepair] = useState({
      dateFixed: null,
      partsBought: [],
      serviceCost: null,
      repairedBy: "",
    })

    const [part, setPart] = useState("")
    const [price, setPrice] = useState(0)
    const [newPart, setNewPart] = useState(false)
    const [loadingUpdate, setLoadingUpdate] = useState(false)

    const [_, _updateRepair] = useMutation(UPDATE_REPAIR)

    const handleCloseModal = () => {
      setModalOpened(false)
    }

    const handlePartInput = () => {
      if (!part || !price) {
        notifications.show({
          title: "Missing required fields",
          color: "orange",
          message: "Ensure you have entered the correct part and price",
        })
        return
      }

      setRepair((_repair) => ({
        ..._repair,
        partsBought: [..._repair?.partsBought, { part, cost: price }],
      }))
      setPart("")
      setPrice(0)
      setNewPart(false)
    }

    const handlePartRemove = (index) => {
      setRepair((_repair) => ({
        ..._repair,
        partsBought: [..._repair?.partsBought?.filter((s, i) => i !== index)],
      }))
      setPart("")
      setPrice(0)
    }

    const handleSaveRepair = () => {
      if (!repair?.dateFixed && !repair?.repairedBy) {
        notifications.show({
          title: "Missing required fields",
          message: "Ensure the  correct date and repaired by fields are filled",
          color: "orange",
        })
        return
      }

      setLoadingUpdate(true)

      _updateRepair({
        updateRepairId: data?.id,
        partsBought: JSON.stringify(repair?.partsBought),
        serviceCost: repair?.serviceCost,
        repairedBy: repair?.repairedBy,
        dateFixed: new Date(repair?.dateFixed).getTime().toString(),
      })
        .then(({ data, error }) => {
          if (data && !error) {
            notifications.show({
              title: "Device ready",
              icon: <IconCheck />,
              color: "green",
            })

            handleCloseModal()
            reexecuteQuery()
          } else {
            notifications.show({
              title: "Error",
              message: "Error saving record",
              icon: <IconExclamationMark />,
              color: "orange",
            })
          }
        })
        .catch((err) => {
          notifications.show({
            title: "Error",
            message: "Error saving record",
            icon: <IconExclamationMark />,
            color: "orange",
          })
        })
        .finally(() => setLoadingUpdate(false))
    }

    if (data?.dateFixed) return null

    if (!user?.adminRights?.includes("UPDATE_REPAIR")) return

    return (
      <div>
        <Button size="xs" onClick={() => setModalOpened(true)}>
          Mark repaired
        </Button>

        <Modal
          size="45%"
          centered
          opened={modalOpened}
          onClose={handleCloseModal}
          title={<h1 className="text-lg font-bold">Repair device</h1>}
        >
          <div className="p-2 space-y-4">
            <div className="space-y-2">
              <p className="text-[0.9rem] font-medium">Parts bought</p>

              {repair?.partsBought?.length > 0 && (
                <div className="p-2 border space-y-2">
                  {repair?.partsBought?.map((r, i) => (
                    <div className="flex justify-between items-center" key={i}>
                      <div className="flex space-x-3 items-center justify-between">
                        <span className="text-[0.7rem]">{r?.part} : </span>
                        <span className="text-[0.7rem]">Ksh. {r?.cost}</span>
                      </div>
                      <Button
                        radius={"lg"}
                        onClick={() => handlePartRemove(i)}
                        p={0}
                        h={16}
                        w={16}
                        color="red"
                      >
                        <IconX size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <br />

              {newPart && (
                <div>
                  <div className="flex justify-between space-x-3 w-full items-center">
                    <TextInput
                      label="Part"
                      placeholder="ex. Screen"
                      value={part}
                      onChange={(e) => setPart(e.target.value)}
                    />
                    <NumberInput
                      prefix="Ksh."
                      thousandSeparator=","
                      value={price}
                      onChange={(val) => setPrice(val)}
                      label="Cost"
                    />

                    <Button
                      className="mt-6"
                      onClick={handlePartInput}
                      size="xs"
                      variant="light"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}

              {!newPart && (
                <Button
                  size="sm"
                  variant="outline"
                  leftSection={<IconPlus size={20} />}
                  fullWidth
                  onClick={() => setNewPart(true)}
                >
                  Add part
                </Button>
              )}
            </div>

            <NumberInput
              prefix="Ksh."
              thousandSeparator
              min={0}
              value={repair?.serviceCost}
              onChange={(val) =>
                setRepair((_repair) => ({ ..._repair, serviceCost: val }))
              }
              label="Service cost"
            />

            <DateInput
              withAsterisk
              maxDate={new Date()}
              value={repair.dateFixed}
              onChange={(val) =>
                setRepair((prev) => ({ ...prev, dateFixed: val }))
              }
              label="Date fixed"
              placeholder="Select a date"
            />

            <TextInput
              value={repair.repairedBy}
              onChange={(e) =>
                setRepair((prev) => ({ ...prev, repairedBy: e.target.value }))
              }
              label="Repaired by"
              withAsterisk
            />

            <Button
              loading={loadingUpdate}
              disabled={loadingUpdate}
              fullWidth
              onClick={handleSaveRepair}
            >
              Save repair
            </Button>
          </div>
        </Modal>
      </div>
    )
  }

  const PartsRender = ({ data }) => {
    const Part = ({ part }) => (
      <Badge variant="light">
        <span className="space-x-3  flex items-center p-0 ">
          <p className="p-0 normal-case text-[0.6rem] tracking-tight">
            {part?.part}
          </p>
          <p className="font-mono text-indigo-700 text-[0.6rem] tracking-tight ">
            Ksh. {part?.cost?.toLocaleString("en-US")}
          </p>
        </span>
      </Badge>
    )
    return (
      <span className="flex flex-nowrap gap-1 pt-[10px]">
        {data?.partsBought?.map((part, i) => (
          <Part part={part} key={i} />
        ))}
      </span>
    )
  }

  const StatusRender = ({ data }) => {
    if (data?.dateFixed)
      return (
        <ActionIcon variant="light" color="green" className="mt-2" radius={32}>
          <IconCheck size={16} />
        </ActionIcon>
      )
  }

  // AG value getters
  const variantDisplay = ({ data }) => {
    if (data?.device) {
      return data?.device?.variant?.model
    }
    return data?.variant
  }

  const imeiDisplay = ({ data }) => {
    if (data?.device) {
      return data?.device?.imei
    }
    return data?.imei
  }

  const defectsDisplay = ({ data }) => {
    if (data?.device) {
      return data?.device?.metadata?.sourceDefects
    }
    return data?.defects
  }

  const colorDisplay = ({ data }) => {
    if (data?.device) {
      return data?.device?.color?.label
    }
    return data?.color
  }

  // AG grid column definitions
  const colDefs = [
    {
      field: "",
      width: 70,
      cellRenderer: StatusRender,
    },
    {
      headerName: "Variant",
      valueGetter: variantDisplay,
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Color",
      valueGetter: colorDisplay,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "imei",
      valueGetter: imeiDisplay,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "defects",
      valueGetter: defectsDisplay,
      cellRenderer: Defect,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "dateBrought",
      valueGetter: ({ data }) =>
        moment(new Date(parseInt(data?.dateBrought))).format("Do MMM YYYY"),
      filter: true,
      floatingFilter: true,
    },
    {
      field: "repairType",
      filter: true,
      valueGetter: ({ data }) =>
        data?.repairType == "refurb_stock"
          ? "Refurbished stock"
          : data?.repairType == "repair_pro"
          ? "Repair Pro"
          : data?.repairType == "warranty_repair"
          ? "Warranty repair"
          : "",
      floatingFilter: true,
    },
    {
      field: "partsBought",
      width: 270,
      filter: true,
      floatingFilter: true,
      cellRenderer: PartsRender,
    },
    {
      field: "serviceCost",
      valueFormatter: (p) => "Ksh." + p?.value?.toLocaleString(),
      width: 120,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "repairCost",
      valueGetter: ({ data }) => {
        let cost =
          data?.partsBought?.reduce((a, o) => {
            return a + o?.cost
          }, 0) + data?.serviceCost

        if (cost) return cost
        return 0
      },
      valueFormatter: ({ value }) => "Ksh." + value?.toLocaleString(),
      width: 120,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "dateFixed",
      valueGetter: ({ data }) =>
        data?.dateFixed
          ? moment(new Date(parseInt(data?.dateFixed))).format("Do MMM YYYY")
          : null,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "repairedBy",
      width: 120,
      filter: true,
      floatingFilter: true,
    },

    {
      field: "",
      width: 150,
      cellRenderer: MoreRender,
      pinned: "right",
    },
  ]

  // Create new repair

  const [newRepairModal, setNewRepairModal] = useState(false)
  const [loadingNewRepair, setLoadingNewRepair] = useState(false)

  const [newRepair, setNewRepair] = useState({
    repairType: null,
    dateBrought: null,
    imei: "",
    variant: "",
    serialNo: "",
    customerName: "",
    customerPhoneNumber: "",
    defects: [],
  })

  const [__, _createNewRepair] = useMutation(CREATE_REPAIR)

  const handleCloseRepairModal = () => {
    setNewRepairModal(false)
  }

  const omit = (obj, ...props) => {
    const result = { ...obj }
    props.forEach(function (prop) {
      delete result[prop]
    })
    return result
  }

  const handleNewRepair = () => {
    setLoadingNewRepair(true)

    _createNewRepair({
      ...omit(newRepair, ["dateBrought"]),
      dateBrought: new Date(newRepair.dateBrought).getTime().toString(),
    })
      .then(({ data, error }) => {
        if (data && !error) {
          handleCloseRepairModal()
          setNewRepair({
            repairType: null,
            repairedBy: null,
            dateBrought: null,
            imei: null,
            variant: null,
            serialNo: null,
            device: null,
            customerName: null,
            customerPhoneNumber: null,
            defect: null,
          })
          notifications.show({
            title: "Repair saved successfully",
            icon: <IconCheck />,
            color: "green",
          })
          reexecuteQuery()
        } else {
          notifications.show({
            title: "An error occured",
            message: "This repair has not been added.",
            icon: <IconExclamationCircleFilled />,
            color: "orange",
          })
        }
      })
      .catch((err) =>
        notifications.show({
          title: "An error occured",
          message: "This repair has not been added.",
          icon: <IconExclamationCircleFilled />,
          color: "orange",
        })
      )
      .finally(() => setLoadingNewRepair(false))
  }

  return (
    <div className="bg-slate-100 p-8 w-full h-screen">
      <h1 className="text-xl font-bold">Repairs</h1>
      <br />

      {user?.adminRights?.includes("ADD_REPAIR") && (
        <div className="w-full flex justify-end">
          <Button
            variant="light"
            onClick={() => setNewRepairModal(true)}
            leftSection={<IconPlus />}
            className="justify-end"
          >
            Add new repair
          </Button>
        </div>
      )}

      <Modal
        opened={newRepairModal}
        onClose={handleCloseRepairModal}
        centered
        title={<h1 className="text-lg font-bold">Add new repair</h1>}
      >
        <div className="p-2 space-y-4">
          <Select
            required
            value={newRepair?.repairType}
            onChange={(selection) =>
              setNewRepair({ ...newRepair, repairType: selection })
            }
            withAsterisk
            label="Repair type"
            radius="md"
            data={[
              { label: "Repair Pro", value: "repair_pro" },
              { label: "Warranty repair", value: "warranty_repair" },
              { label: "Refurbished stock", value: "refurb_stock" },
            ]}
          />

          <DateInput
            required
            value={newRepair?.dateBrought}
            onChange={(date) =>
              setNewRepair((prev) => ({ ...prev, dateBrought: date }))
            }
            withAsterisk
            label="Date Brought"
            maxDate={new Date()}
            radius="md"
          />

          <TagsInput
            withAsterisk
            label="Defects"
            value={newRepair?.defects}
            radius="md"
            data={[]}
            onChange={(val) => {
              setNewRepair((prev) => ({
                ...prev,
                defects: val,
              }))
            }}
          />

          <TextInput
            required
            value={newRepair?.imei || ""}
            onChange={(e) =>
              setNewRepair((prev) => ({ ...prev, imei: e.target.value }))
            }
            withAsterisk
            label="IMEI"
            radius="md"
          />

          <TextInput
            required
            value={newRepair?.variant || ""}
            onChange={(e) =>
              setNewRepair((prev) => ({ ...prev, variant: e.target.value }))
            }
            withAsterisk
            label="Device model"
            radius="md"
          />

          <TextInput
            required
            value={newRepair?.serialNo}
            onChange={(e) =>
              setNewRepair((prev) => ({ ...prev, serialNo: e.target.value }))
            }
            withAsterisk
            label="Serial Number"
            radius="md"
          />

          <TextInput
            required
            value={newRepair?.customerName}
            onChange={(e) =>
              setNewRepair((prev) => ({
                ...prev,
                customerName: e.target.value,
              }))
            }
            withAsterisk
            label="Customer Name"
            radius="md"
          />

          <TextInput
            required
            value={newRepair?.customerPhoneNumber}
            onChange={(e) =>
              setNewRepair((prev) => ({
                ...prev,
                customerPhoneNumber: e.target.value,
              }))
            }
            withAsterisk
            label="Customer Phone Number"
            radius="md"
          />

          {newRepair.repairType &&
            newRepair.dateBrought &&
            newRepair.imei &&
            newRepair.variant &&
            newRepair.serialNo &&
            newRepair.customerName &&
            newRepair.customerPhoneNumber &&
            newRepair.defects.length > 0 && (
              <Button
                loading={loadingNewRepair}
                disabled={loadingNewRepair}
                fullWidth
                onClick={handleNewRepair}
              >
                Save repair
              </Button>
            )}
        </div>
      </Modal>

      <div
        className="ag-theme-quartz mt-4" // applying the Data Grid theme
        style={{ height: height - 150 }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact rowData={data?.getRepairs} columnDefs={colDefs} />
      </div>
    </div>
  )
}

export default Repairs
