import {
  Badge,
  Button,
  Checkbox,
  Code,
  ColorInput,
  ColorSwatch,
  Menu,
  Modal,
  MultiSelect,
  Select,
  Tabs,
  TagsInput,
  TextInput,
  Textarea,
  NumberInput,
} from "@mantine/core"
import React, { useEffect, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import { useViewportSize } from "@mantine/hooks"
import {
  IconCheck,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconExclamationCircle,
  IconExclamationMark,
  IconInfoCircle,
  IconPlus,
  IconUpload,
  IconX,
} from "@tabler/icons-react"
import { useMutation, useQuery } from "urql"
import {
  CREATE_DEVICE,
  EDIT_DEVICE,
  GET_CUSTOMERS,
  GET_DEVICES,
  GET_OFFERS,
  GET_VARIANTS,
  SELL_DEVICE,
  SET_DEVICE_ON_OFFER,
  TOGGLE_VISIBILITY,
} from "@/lib/request"
import { notifications } from "@mantine/notifications"

import {
  CldImage,
  CldOgImage,
  CldUploadButton,
  CldUploadWidget,
} from "next-cloudinary"
import Image from "next/image"

import { useUser } from "@/context/User"
import { useRouter } from "next/router"
import { DateInput, DatePickerInput } from "@mantine/dates"

function Devices() {
  const { user } = useUser()
  // Mantine hooks

  const { height } = useViewportSize()

  // States
  const [newDeviceModal, setNewDeviceModal] = useState(false)
  const [device, setDevice] = useState({
    variant: null,
    imei: null,
    serial: null,
    grade: null,
    buyBackPrice: null,
    grade: "",
    defects: [],
    websiteVisibility: false,
    sourceType: "",
    color: "",
    storage: "",
    sourceName: "",
    images: [],
    price: 0,
    description: "",
  })

  const [rIMEI, setRIMEI] = useState(null)
  const [hasDefects, setHasDefects] = useState(false)

  const [loadingCreate, setLoadingCreate] = useState(false)

  // AG grid renderers
  const RepairStatus = ({ value }) => {
    return (
      <Badge
        className="mt-[10px]"
        size="sm"
        radius={"sm"}
        color={value == "ready" ? "green" : "orange"}
      >
        {value}
      </Badge>
    )
  }

  const Defect = ({ value }) => {
    return (
      <div className="space-x-1">
        {value?.map((defect, i) => (
          <Code key={i}>{defect}</Code>
        ))}
      </div>
    )
  }

  const Actions = ({ data }) => {
    const router = useRouter()

    // Editing
    const [editModal, setEditModal] = useState(false)

    const [loadingEdit, setLoadingEdit] = useState(false)

    const [__, _editDevice] = useMutation(EDIT_DEVICE)

    const [{ data: deviceData }, reexecuteQuery] = useQuery({
      query: GET_DEVICES,
    })

    const [device, setDevice] = useState({
      variant: data?.variant?.id,
      imei: data?.imei,
      serial: data?.serialNo,
      grade: data?.grade,
      buyBackPrice: data?.buyBackPrice,
      grade: data?.grade,
      sourceType: data?.metadata?.sourceType,
      color: data?.color?.id,
      storage: data?.storage?.id,
      sourceName: data?.metadata?.sourceName,
    })

    const handleEdit = () => {
      setLoadingEdit(true)

      _editDevice({
        editDeviceId: data?.id,
        serial: device?.serial,
        imei: device?.imei,
        variant: device?.variant,
        buyBackPrice: device?.buyBackPrice,
        grade: device?.grade,
        storage: device?.storage,
        color: device?.color,
        metadata: JSON.stringify({
          sourceType: device?.sourceType, // Import or BuyBack
          sourceName: device?.sourceName,
          sourceDefects: data?.metadata?.sourceDefects,
          purchaseDate: data?.metadata?.purchaseDate,
          repairDate: data?.metadata?.repairDate,
          isRepaired: data?.metadata?.isRepaired,
        }),
      })
        .then(({ data, error }) => {
          if (data && !error) {
            notifications.show({
              title: "Device updated",
              color: "green",
              icon: <IconCheck />,
            })
            reexecuteQuery()
            setEditModal(false)
          }
        })
        .finally(() => setLoadingEdit(false))
    }

    // Offers
    const [{ data: offersData, fetching: offersFetching, error: offersError }] =
      useQuery({
        query: GET_OFFERS,
      })

    const [loadingOffer, setLoadingOffer] = useState(false)
    const [offersModal, setOffersModal] = useState(false)

    const [offer, setOffer] = useState({
      id: null,
      price: null,
    })

    const [x, _setDeviceOnOffer] = useMutation(SET_DEVICE_ON_OFFER)

    const handleAddToOffer = () => {
      if (!offer?.id || !offer?.price) {
        notifications.show({
          title: "Missing fields ",
          message:
            "Ensure both the offer and price fields are filled correctly",
          color: "orange",
        })
        return
      }

      setLoadingOffer(true)

      _setDeviceOnOffer({
        offerId: offer?.id,
        deviceId: data?.id,
        price: offer?.price,
      })
        .then(({ data, error }) => {
          if (data && !error) {
            notifications.show({
              title: "Device added to the offer successfully",
              color: "green",
              icon: <IconCheck />,
            })
            reexecuteQuery()
          } else {
            notifications.show({
              title: "Something wrong happened",
              color: "orange",
            })
          }
        })
        .catch((err) => {
          notifications.show({
            title: "Something wrong happened",
            color: "orange",
          })
        })
        .finally(() => {
          setLoadingOffer(false)
        })
    }

    const handleCloseOffers = () => {
      setOffersModal(false)
    }

    // Selling device
    const [sellModal, setSellModal] = useState(false)

    const [financing, setFinancing] = useState(false)

    const [sale, setSale] = useState({
      customerName: "",
      customerPhoneNumber: "",
      customerId: null,
      compliments: [],
      sellPrice: 0,
      financingOption: "",
      txCodes: [],
      paymentMode: "",
      deviceId: data?.id,
    })

    const [sellDate, setSellDate] = useState("")

    const [loadingSell, setLoadingSell] = useState(false)

    const [_, _sellDevice] = useMutation(SELL_DEVICE)

    const [{ data: customerData, fetching, error }] = useQuery({
      query: GET_CUSTOMERS,
    })

    useEffect(() => {
      if (
        customerData?.getCustomers.length > 0 &&
        sale.customerPhoneNumber.length == 9
      ) {
        let customer = customerData?.getCustomers.filter((customer) =>
          customer?.phoneNumber?.includes(sale.customerPhoneNumber)
            ? customer
            : null
        )[0]

        if (customer)
          setSale({
            ...sale,
            customerId: customer?.id,
            customerName: customer?.name,
          })
      }

      if (sale?.customerId) {
        setSale({ ...sale, customerId: null, customerName: "" })
      }
    }, [sale?.customerPhoneNumber])

    const handleCloseSell = () => {
      setSellModal(false)
    }

    const handleSellDevice = () => {
      if (
        !sale?.customerName &&
        !sale?.customerId &&
        !sale?.sellPrice &&
        sale?.txCodes.length < 1 &&
        !sale?.paymentMode &&
        !sellDate
      ) {
        notifications.show({
          title: "Missing required fields",
          message: "Ensure all necessary fields are filled",
          color: "orange",
        })
        return
      }
      setLoadingSell(true)
      _sellDevice({
        ...sale,
        sellDate: new Date(sellDate).getTime().toString(),
      })
        .then(({ data }) => {
          if (data && !error) {
            notifications.show({
              title: "Sale recorded successfully",
              message: "Device now off the market",
              color: "green",
              icon: <IconCheck />,
            })

            reexecuteQuery()
            setSellModal(false)
          } else {
            notifications.show({
              color: "red",
              title: "Sale failed to save",
              message: "An error occured",
            })
          }
        })
        .catch((err) => {
          notifications.show({
            color: "red",
            title: "Sale failed to save",
            message: "An error occured",
          })
        })
        .finally(() => {
          setLoadingSell(false)
        })
    }

    return (
      <div className="flex justify-center items-center mt-[10px]">
        <Menu shadow="md">
          <Menu.Target>
            <Button p={0} w={24} h={24} size="xs" variant="light">
              <IconDotsVertical size={16} />
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            {user?.adminRights?.includes("EDIT_DEVICE") && (
              <Menu.Item onClick={() => setEditModal(true)}>
                Edit device
              </Menu.Item>
            )}
            {data?.metadata?.isRepaired &&
              user?.adminRights?.includes("OFFER_MANAGEMENT") && (
                <Menu.Item onClick={() => setOffersModal(true)}>
                  Add to offers
                </Menu.Item>
              )}
            <Menu.Item onClick={() => setSellModal(true)}>
              Sell device
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <Modal
          centered
          opened={editModal}
          onClose={() => setEditModal(false)}
          title={<h1 className="text-lg font-bold">Edit device</h1>}
        >
          <div className="p-2 space-y-4">
            <TextInput
              required
              value={device?.imei}
              withAsterisk
              label="IMEI"
              radius="md"
              onChange={(e) => {
                setDevice((_device) => ({
                  ..._device,
                  imei: e.target.value,
                }))
              }}
              error={
                deviceData?.getDevices
                  ?.filter((_device) => _device?.imei !== data?.imei)
                  .find((_device) => _device?.imei == device?.imei)
                  ? "Device with this IMEI already exists"
                  : null
              }
            />

            <TextInput
              required
              value={device?.serial}
              withAsterisk
              label="Serial number"
              radius="md"
              onChange={(e) => {
                setDevice((_device) => ({
                  ..._device,
                  serial: e.target.value,
                }))
              }}
            />

            <Select
              required
              value={device?.storage}
              withAsterisk
              label="Storage capacity"
              radius="md"
              data={variantsData?.getVariants
                ?.find(({ id }) => id == device?.variant)
                ?.storages?.map(({ label, id }) => ({ label, value: id }))}
              onChange={(selection) =>
                setDevice((_device) => ({ ..._device, storage: selection }))
              }
            />

            <Select
              required
              value={device?.color}
              withAsterisk
              label="Color"
              radius="md"
              data={variantsData?.getVariants
                ?.find(({ id }) => id == device?.variant)
                ?.colors?.map(({ label, id }) => ({ label, value: id }))}
              onChange={(selection) =>
                setDevice((_device) => ({ ..._device, color: selection }))
              }
            />

            <Select
              value={device?.grade}
              label="Grade"
              radius="md"
              data={["A", "B", "C"]}
              onChange={(selection) =>
                setDevice((_device) => ({ ..._device, grade: selection }))
              }
            />

            <Select
              required
              value={device?.sourceType}
              withAsterisk
              label="Purchase type"
              radius="md"
              data={["Import", "BuyBack"]}
              onChange={(selection) =>
                setDevice((_device) => ({ ..._device, sourceType: selection }))
              }
            />

            <TextInput
              required
              value={device?.sourceName}
              withAsterisk
              label="Source"
              radius="md"
              onChange={(e) => {
                setDevice((_device) => ({
                  ..._device,
                  sourceName: e.target.value,
                }))
              }}
            />

            <NumberInput
              required
              thousandSeparator
              min={0}
              prefix="Ksh."
              value={device?.buyBackPrice}
              onChange={(val) =>
                setDevice((_device) => ({ ..._device, buyBackPrice: val }))
              }
              label="Purchase price"
            />

            <Button
              loading={loadingEdit}
              disabled={loadingEdit}
              fullWidth
              onClick={handleEdit}
            >
              Update device
            </Button>
          </div>
        </Modal>

        <Modal
          centered
          opened={offersModal && offersData}
          onClose={handleCloseOffers}
          title={<h1 className="text-lg font-bold">Set device on offer</h1>}
        >
          <div className="p-2 space-y-3">
            <Select
              withAsterisk
              label="Offer"
              data={offersData?.getOffers?.map((offer) => ({
                label: offer?.info?.label,
                value: offer?.info?.id,
              }))}
              value={offer?.id}
              onChange={(selection) => setOffer({ ...offer, id: selection })}
            />

            <NumberInput
              prefix="Ksh."
              withAsterisk
              thousandSeparator
              value={offer?.price}
              min={0}
              label="Offer price"
              onChange={(val) => setOffer({ ...offer, price: val })}
            />
            <br />

            <Button
              fullWidth
              onClick={handleAddToOffer}
              loading={loadingOffer}
              disabled={loadingOffer}
            >
              Make device on offer
            </Button>
          </div>
        </Modal>

        <Modal
          centered
          opened={sellModal}
          onClose={handleCloseSell}
          title={<h1 className="text-lg font-bold">Sell device</h1>}
        >
          <div className="p-2 space-y-4">
            <TextInput
              required
              placeholder="ex. 712345678"
              value={sale?.customerPhoneNumber}
              withAsterisk
              label="Customer phone number"
              radius="md"
              onChange={(e) => {
                setSale((_sale) => ({
                  ..._sale,
                  customerPhoneNumber: e.target.value,
                }))
              }}
            />

            <TextInput
              required
              value={sale?.customerName}
              withAsterisk
              label="Customer name"
              radius="md"
              onChange={(e) => {
                setSale((_sale) => ({
                  ..._sale,
                  customerName: e.target.value,
                }))
              }}
            />

            <Checkbox
              label="Purchase using financing ?"
              checked={financing}
              onChange={(event) => setFinancing(event.currentTarget.checked)}
            />

            {financing && (
              <div className="space-y-4">
                <Select
                  required
                  value={sale?.financingOption}
                  onChange={(selection) =>
                    setSale((_sale) => ({
                      ..._sale,
                      financingOption: selection,
                    }))
                  }
                  withAsterisk
                  label="Financer"
                  radius="md"
                  data={["buySimu", "chanteq"]}
                  searchable
                />
              </div>
            )}

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
                }))
              }}
            />

            <TagsInput
              data={[]}
              label="Compliments"
              value={sale?.compliments}
              onChange={(compliments) => {
                setSale((_sale) => ({
                  ..._sale,
                  compliments,
                }))
              }}
            />

            <NumberInput
              prefix="Ksh."
              thousandSeparator=","
              min={0}
              max={700000}
              value={sale?.sellPrice}
              onChange={(val) => setSale({ ...sale, sellPrice: val })}
              label="Selling price"
            />

            <DateInput
              value={sellDate}
              maxDate={new Date()}
              onChange={(val) => setSellDate(val)}
              placeholder="When was device sold?"
              label="Sale date"
            />

            <Button
              loading={loadingSell}
              disabled={loadingSell}
              fullWidth
              onClick={handleSellDevice}
            >
              Record sale
            </Button>
          </div>
        </Modal>
      </div>
    )
  }

  // AG grid column definitions
  const colDefs = [
    {
      headerName: "Variant",
      valueGetter: ({ data: { variant } }) => variant?.model,
      filter: true,
      floatingFilter: true,
      pinned: "left",
    },
    {
      field: "imei",
      width: 150,
      filter: true,
      floatingFilter: true,
      pinned: "left",
    },
    {
      field: "serialNo",
      width: 150,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "color",
      valueGetter: ({ data }) => data?.color?.label,
      width: 150,
      filter: true,
      floatingFilter: true,
    },

    {
      field: "storage/Label",
      valueGetter: ({ data }) => data?.storage?.label,
      width: 150,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "grade",
      width: 90,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "purchasePrice",
      valueGetter: ({ data: { buyBackPrice } }) => buyBackPrice,
      valueFormatter: (p) => "Ksh." + p?.value?.toLocaleString(),
      filter: true,
      floatingFilter: true,
    },
    {
      field: "repairCost",
      valueGetter: ({ data: { metadata } }) => metadata?.repairCost,
      valueFormatter: (p) => "Ksh." + p?.value?.toLocaleString(),
      filter: true,
      floatingFilter: true,
    },

    {
      field: "defects",
      valueGetter: ({ data }) => data?.metadata?.sourceDefects,
      cellRenderer: Defect,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "repairStatus",
      valueGetter: ({ data }) =>
        data?.metadata?.isRepaired ? "ready" : "not fixed",
      cellRenderer: RepairStatus,
      width: 120,
      filter: true,
      floatingFilter: true,
    },

    {
      headerName: "Offer",
      valueGetter: ({ data }) => {
        let now = new Date().getTime()
        if (
          now > parseInt(data?.offer?.info?.start) &&
          now < parseInt(data?.offer?.info?.end)
        ) {
          return `Ksh. ${data?.offer?.price?.toLocaleString("en-US")} (${
            data?.offer?.info?.label
          })`
        }

        return
      },
      width: 150,
      filter: true,
      floatingFilter: true,
    },

    {
      field: "sourceType",
      filter: true,
      valueGetter: ({ data }) => data?.metadata?.sourceType,
      floatingFilter: true,
    },
    {
      field: "sourceName",
      filter: true,
      valueGetter: ({ data }) => data?.metadata?.sourceName,
      floatingFilter: true,
    },
    {
      field: "",
      cellRenderer: Actions,
      width: 60,
      pinned: "right",
    },
  ]

  // Requests

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_DEVICES,
  })

  const [{ data: variantsData }] = useQuery({
    query: GET_VARIANTS,
  })

  const [_, _createDevice] = useMutation(CREATE_DEVICE)
  // Functions

  const handleCloseDeviceModal = () => {
    setNewDeviceModal(false)
    setDevice({})
    return
  }

  const handleSaveDevice = (e) => {
    e.preventDefault()

    if (data?.getDevices?.find((_device) => _device?.imei == device?.imei)) {
      notifications.show({
        title: "Duplicate record warning",
        message: "A device with this IMEI already exists in the system",
        icon: <IconExclamationMark />,
        color: "orange",
      })
      return
    }

    if (device?.imei && rIMEI && rIMEI !== device?.imei) {
      notifications.show({
        title: "IMEIs do not match",
        message: "Please confirm IMEI before saving device",
        icon: <IconExclamationMark />,
        color: "orange",
      })
      return
    }

    // if (
    //   device?.publicAvailability &&
    //   (device?.images.length < 1 || !device?.price)
    // ) {
    //   notifications.show({
    //     title: "Missing data",
    //     message:
    //       "Cannot publish device to website without a sale price or images",
    //     icon: <IconExclamationMark />,
    //     color: "orange",
    //   });
    //   return;
    // }
    setLoadingCreate(true)

    _createDevice({
      serial: device?.serial,
      imei: device?.imei,
      variant: device?.variant,
      buyBackPrice: device?.buyBackPrice,
      grade: device?.grade,
      storage: device?.storage,
      color: device?.color,
      metadata: JSON.stringify({
        sourceType: device?.sourceType, // Import or BuyBack
        sourceName: device?.sourceName,
        sourceDefects: device?.defects,
        purchaseDate: new Date().getTime().toString(),
        repairDate: null,
        isRepaired: device?.defects?.length > 0 ? false : true,
      }),
    })
      .then(({ data, error }) => {
        if (data && !error) {
          notifications.show({
            title: "Success",
            message: "New device saved successfully",
            icon: <IconCheck />,
            color: "green",
          })
          reexecuteQuery()
          handleCloseDeviceModal()
        } else {
          notifications.show({
            title: "Error",
            message: "Error saving device",
            icon: <IconExclamationMark />,
            color: "orange",
          })
        }
      })
      .catch((err) => {
        notifications.show({
          title: "Error",
          message: "Error saving device",
          icon: <IconExclamationMark />,
          color: "orange",
        })
      })
      .finally(() => setLoadingCreate(false))
  }

  return (
    <div className="bg-slate-100 p-8 w-full h-screen">
      <h1 className="text-xl font-bold">Inventory</h1>
      <br />

      {user?.adminRights?.includes("ADD_DEVICE") && (
        <div className="w-full flex justify-end">
          <Button
            variant="light"
            onClick={() => setNewDeviceModal(true)}
            leftSection={<IconPlus />}
            className="justify-end"
          >
            Add new device
          </Button>
        </div>
      )}

      <Modal
        opened={newDeviceModal}
        onClose={handleCloseDeviceModal}
        centered
        title={<h1 className="text-lg font-bold">Add new device</h1>}
      >
        <form onSubmit={handleSaveDevice} className="p-2 space-y-4">
          <div className="text-orange-400 flex">
            <IconInfoCircle className="inline mr-2" color="orange" />
            <span className="text-[0.8rem]">
              Once a device is added to the inventory it cannot be removed , it
              can only be sold or edited
            </span>
          </div>
          <TextInput
            required
            value={device?.imei}
            withAsterisk
            label="IMEI"
            radius="md"
            onChange={(e) => {
              setDevice((_device) => ({
                ..._device,
                imei: e.target.value,
              }))
            }}
            error={
              data?.getDevices?.find((_device) => _device?.imei == device?.imei)
                ? "Device with this IMEI already exists"
                : null
            }
          />

          <TextInput
            required
            value={rIMEI}
            withAsterisk
            label="Confirm IMEI"
            radius="md"
            onChange={(e) => {
              setRIMEI(e.target.value)
            }}
            error={
              device?.imei &&
              rIMEI &&
              rIMEI !== device?.imei &&
              "IMEIs do not match"
            }
          />

          <TextInput
            required
            value={device?.serial}
            withAsterisk
            label="Serial number"
            radius="md"
            onChange={(e) => {
              setDevice((_device) => ({
                ..._device,
                serial: e.target.value,
              }))
            }}
          />

          <Select
            required
            value={device?.variant}
            onChange={(selection) =>
              setDevice((_device) => ({ ..._device, variant: selection }))
            }
            withAsterisk
            label="Variant"
            description="Please select one"
            radius="md"
            data={variantsData?.getVariants?.map((variant) => ({
              label: variant?.model,
              value: variant?.id,
            }))}
            searchable
          />

          <Select
            required
            value={device?.storage}
            withAsterisk
            label="Storage capacity / Label"
            radius="md"
            data={variantsData?.getVariants
              ?.find(({ id }) => id == device?.variant)
              ?.storages?.map(({ label, id }) => ({ label, value: id }))}
            onChange={(selection) =>
              setDevice((_device) => ({ ..._device, storage: selection }))
            }
          />

          <Select
            required
            value={device?.color}
            withAsterisk
            label="Color"
            radius="md"
            data={variantsData?.getVariants
              ?.find(({ id }) => id == device?.variant)
              ?.colors?.map(({ label, id }) => ({ label, value: id }))}
            onChange={(selection) =>
              setDevice((_device) => ({ ..._device, color: selection }))
            }
          />

          <Select
            value={device?.grade}
            label="Grade"
            radius="md"
            data={["A", "B", "C"]}
            onChange={(selection) =>
              setDevice((_device) => ({ ..._device, grade: selection }))
            }
          />

          <Checkbox
            value={hasDefects}
            onChange={(e) => setHasDefects(e.currentTarget.checked)}
            label="This device has some defects"
          />

          {hasDefects && (
            <>
              <p>
                <IconInfoCircle
                  className="inline mr-1"
                  color="orange"
                  size={20}
                />
                <span className="text-[0.8rem] text-orange-500 ">
                  If there are no defects that should be repaired , leave
                  &ldquo;Defects&ldquo; field below blank
                </span>
              </p>
              <TagsInput
                label="Defects"
                value={device?.defects}
                radius="md"
                data={[]}
                onChange={(val) => {
                  setDevice((_device) => ({
                    ..._device,
                    defects: val,
                  }))
                }}
              />
            </>
          )}

          <Select
            required
            value={device?.sourceType}
            withAsterisk
            label="Purchase type"
            radius="md"
            data={["Import", "BuyBack"]}
            onChange={(selection) =>
              setDevice((_device) => ({ ..._device, sourceType: selection }))
            }
          />

          <TextInput
            required
            value={device?.sourceName}
            withAsterisk
            label="Source"
            radius="md"
            onChange={(e) => {
              setDevice((_device) => ({
                ..._device,
                sourceName: e.target.value,
              }))
            }}
          />

          <NumberInput
            required
            thousandSeparator
            min={0}
            prefix="Ksh."
            value={device?.buyBackPrice}
            onChange={(val) =>
              setDevice((_device) => ({ ..._device, buyBackPrice: val }))
            }
            label="Purchase price"
          />

          <Button
            loading={loadingCreate}
            disabled={loadingCreate}
            fullWidth
            type="submit"
          >
            Save device
          </Button>
        </form>
      </Modal>

      <div
        className="ag-theme-quartz mt-4" // applying the Data Grid theme
        style={{
          height: user?.adminRights?.includes("ADD_DEVICE")
            ? height - 200
            : height - 165,
        }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact rowData={data?.getDevices} columnDefs={colDefs} />
      </div>
    </div>
  )
}

export default Devices
