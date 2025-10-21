import {
  Badge,
  Button,
  Checkbox,
  Code,
  ColorInput,
  ColorSwatch,
  Divider,
  Group,
  Menu,
  Modal,
  MultiSelect,
  NumberInput,
  Radio,
  Select,
  Tabs,
  TagsInput,
  TextInput,
  Textarea,
  Timeline,
} from "@mantine/core"
import React, { useCallback, useEffect, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import { useViewportSize } from "@mantine/hooks"
import {
  IconCheck,
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
  CANCEL_BUYBACK,
  COMPLETE_BUYBACK,
  CREATE_DEVICE,
  GET_DEVICES,
  GET_TRADE_IN_REQUESTS,
  GET_VARIANTS,
  UPDATE_BUYBACK,
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
import { useUser } from "@/context/User"

function TradeInRequests() {
  // Mantine hooks

  const { height } = useViewportSize()
  const { user } = useUser()

  // States

  const [newDeviceModal, setNewDeviceModal] = useState(false)
  const [device, setDevice] = useState({
    variant: null,
    imei: null,
    serial: null,
    grade: null,
    buyBackPrice: 0,
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

  const [loadingCreate, setLoadingCreate] = useState(false)

  // AG grid renderers

  const Actions = ({ data }) => {
    const [modalOpened, setModalOpened] = useState(false)
    const [loadingUpdate, setLoadingUpdate] = useState(false)
    const [loadingRemove, setLoadingRemove] = useState(false)

    const [editable, setEditable] = useState(false)

    const [hasDefects, setHasDefects] = useState(false)
    const [buyBack, setBuyBack] = useState({
      variant: data?.variant?.id,
      color: data?.color,
      storage: data?.storage,
      batteryHealth: data?.batteryHealth,
      frontCamOk: data?.frontCamOk,
      backCamOk: data?.backCamOk,
      earpieceOk: data?.earpieceOk,
      mouthpieceOk: data?.mouthpieceOk,
      speakerOk: data?.speakerOk,
      authorizationOk: data?.authorizationOk,
      simTrayPresent: data?.simTrayPresent,
      chargingOk: data?.chargingOk,
      screenCondition: data?.screenCondition,
      sideNBackCondition: data?.sideNBackCondition,
      offer: data?.offer,
      defects: [],
      imei: "",
      serialNo: "",
      grade: "",
    })

    const calculateOffer = useCallback(
      (buyBack) => {
        let price = Math.round(
          data?.variant?.storages?.find(({ id }) => id == data?.storage)
            ?.price * 0.4
        )

        const screenReplacement =
          buyBack?.screenCondition === "cracked" ||
          buyBack?.screenCondition === "used"

        const bodyReplacement =
          buyBack?.sideNBackCondition === "cracked" ||
          buyBack?.sideNBackCondition === "used"

        const batteryReplacement = buyBack?.batteryHealth <= 95

        const deductions = [
          {
            condition: screenReplacement,
            cost: data?.variant?.screenCost || 0,
          },
          { condition: bodyReplacement, cost: data?.variant?.bodyCost || 0 },
          {
            condition: batteryReplacement,
            cost: data?.variant?.batteryCost || 0,
          },
          {
            condition: !buyBack?.frontCamOk,
            cost: data?.variant?.frontCamCost || 0,
          },
          {
            condition: !buyBack?.backCamOk,
            cost: data?.variant?.backCamCost || 0,
          },
          {
            condition: !buyBack?.earpieceOk,
            cost: data?.variant?.earpieceCost || 0,
          },
          {
            condition: !buyBack?.mouthpieceOk,
            cost: data?.variant?.mouthpieceCost || 0,
          },
          {
            condition: !buyBack?.speakerOk,
            cost: data?.variant?.speakerCost || 0,
          },
          {
            condition: !buyBack?.authorizationOk,
            cost: data?.variant?.authCost || 0,
          },
          {
            condition: !buyBack?.simTrayPresent,
            cost: data?.variant?.simTrayCost || 0,
          },
          {
            condition: !buyBack?.chargingOk,
            cost: data?.variant?.motherBoardCost || 0,
          },
        ]

        deductions.forEach(({ condition, cost }) => {
          if (condition) price -= cost
        })

        return price
      },
      [data]
    )

    useEffect(() => {
      setBuyBack((prev) => {
        const newOffer = calculateOffer(prev)
        return prev.offer !== newOffer ? { ...prev, offer: newOffer } : prev
      })
    }, [
      buyBack.screenCondition,
      buyBack.sideNBackCondition,
      buyBack.batteryHealth,
      buyBack.frontCamOk,
      buyBack.backCamOk,
      buyBack.earpieceOk,
      buyBack.mouthpieceOk,
      buyBack.speakerOk,
      buyBack.authorizationOk,
      buyBack.simTrayPresent,
      buyBack.chargingOk,
      calculateOffer,
    ])
    //   Requests

    const [_, _completeBuyBack] = useMutation(COMPLETE_BUYBACK)

    const [{ data: variantsData }] = useQuery({
      query: GET_VARIANTS,
    })

    const [__, _cancelBuyBack] = useMutation(CANCEL_BUYBACK)

    //   Functions

    const handleCloseModal = () => {
      setModalOpened(false)
    }

    const handleCancelBuyBack = () => {
      setLoadingRemove(true)

      _cancelBuyBack({
        cancel: true,
        updateBuyBackId: data?.id,
      })
        .then(({ data, error }) => {
          if (data && !error) {
            notifications.show({
              title: "Request cancelled successfully",
              color: "green",
              icon: <IconCheck />,
            })
          }
        })

        .finally(() => setLoadingRemove(false))
    }

    const omit = (obj, ...props) => {
      const result = { ...obj }
      props.forEach(function (prop) {
        delete result[prop]
      })
      return result
    }

    const handleAddDevice = () => {
      if (
        !buyBack?.color ||
        !buyBack?.imei ||
        !buyBack?.serialNo ||
        !buyBack?.grade
      ) {
        notifications.show({
          title: "Missing fields found",
          color: "orange",
          message:
            "Ensure you have entered the correct color , imei , serial no and grade",
        })
        return
      }
      setLoadingUpdate(true)

      _completeBuyBack({
        ...omit(buyBack, ["batteryHealth"]),
        completeBuybackId: data?.id,
        customerName: data?.user?.name,
        customerPhone: data?.user?.phoneNumber,
      })
        .then(({ data, error }) => {
          if (data) {
            notifications.show({
              title: "Successs",
              message: "Device now in inventory",
              icon: <IconCheck />,
              color: "green",
            })
            setModalOpened(false)
            reexecuteQuery()
          } else {
            notifications.show({
              title: "Error",
              message: "Error adding device",
              icon: <IconExclamationMark />,
              color: "orange",
            })
          }
        })
        .catch((err) => {
          notifications.show({
            title: "Error",
            message: "Error adding device",
            icon: <IconExclamationMark />,
            color: "orange",
          })
        })
        .finally(() => setLoadingUpdate(false))
    }

    if (data?.payment?.timestamp || data?.cancelled) return

    if (!user?.adminRights?.includes("APPROVE_TRADEINS")) return

    return (
      <div>
        <Button
          size="xs"
          w={20}
          h={20}
          p={0}
          variant="light"
          onClick={() => setModalOpened(true)}
        >
          <IconDotsVertical size={16} />
        </Button>

        <Modal
          centered
          opened={modalOpened}
          onClose={handleCloseModal}
          title={<h1 className="text-lg font-bold">Buy back</h1>}
        >
          <div className="p-2">
            <Tabs defaultValue="complete">
              <Tabs.List>
                <Tabs.Tab value="complete">Complete buyback</Tabs.Tab>
                <Tabs.Tab value="cancel">Cancel</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="complete">
                <div className="py-8">
                  <Timeline active={1} bulletSize={24} lineWidth={2}>
                    <Timeline.Item title="Customer">
                      <div className="mt-4">
                        <strong>{data?.user?.name}</strong>
                        <p className="text-slate-500">
                          {data?.user?.phoneNumber}
                        </p>
                        <p className="text-slate-500">{data?.user?.email}</p>
                      </div>
                    </Timeline.Item>

                    <Timeline.Item title="Device">
                      <div className="p-2 space-y-4">
                        <Select
                          defaultValue={data?.variant?.id}
                          required
                          value={buyBack?.variant}
                          onChange={(selection) =>
                            setBuyBack((_device) => ({
                              ..._device,
                              variant: selection,
                            }))
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
                          value={buyBack?.storage}
                          withAsterisk
                          label="Storage capacity"
                          radius="md"
                          data={variantsData?.getVariants
                            ?.find(({ id }) => id == buyBack?.variant)
                            ?.storages?.map(({ label, id }) => ({
                              label,
                              value: id,
                            }))}
                          onChange={(selection) =>
                            setBuyBack((_device) => ({
                              ..._device,
                              storage: selection,
                            }))
                          }
                        />

                        <Select
                          value={buyBack?.sideNBackCondition}
                          withAsterisk
                          label="Sides and back condition"
                          radius="md"
                          data={["flawless", "used", "cracked"]}
                          onChange={(selection) =>
                            setBuyBack({
                              ...buyBack,
                              sideNBackCondition: selection,
                            })
                          }
                        />

                        <Select
                          value={buyBack?.screenCondition}
                          withAsterisk
                          label="Screen condition"
                          radius="md"
                          data={["flawless", "used", "cracked"]}
                          onChange={(selection) =>
                            setBuyBack((_device) => ({
                              ..._device,
                              screenCondition: selection,
                            }))
                          }
                        />

                        {variantsData?.getVariants?.find(
                          ({ id }) => id == data?.variant?.id
                        )?.brand == "Apple" ? (
                          <NumberInput
                            min={0}
                            max={100}
                            suffix="%"
                            label="Battery health"
                            value={buyBack.batteryHealth}
                            withAsterisk
                            onChange={(val) =>
                              setBuyBack((_device) => ({
                                ..._device,
                                batteryHealth: val,
                              }))
                            }
                          />
                        ) : (
                          <Select
                            value={buyBack?.batteryHealth.toString()}
                            onChange={(selection) =>
                              setBuyBack((_device) => ({
                                ..._device,
                                batteryHealth: parseInt(selection),
                              }))
                            }
                            withAsterisk
                            label="Battery status"
                            radius="md"
                            required
                            data={[
                              { label: "Weak", value: "49" },
                              { label: "Normal", value: "99" },
                            ]}
                          />
                        )}

                        <Radio.Group
                          required
                          label="Is the front camera okay ?"
                          onChange={(selection) =>
                            setBuyBack({
                              ...buyBack,
                              frontCamOk: selection == "yes" ? true : false,
                            })
                          }
                          value={buyBack?.frontCamOk ? "yes" : "no"}
                          withAsterisk
                        >
                          <Group mt="xs">
                            <Radio
                              value="yes"
                              className="border p-4 rounded-md"
                              label="Yes"
                            />
                            <Radio
                              value="no"
                              className="border p-4 rounded-md"
                              label="No"
                            />
                          </Group>
                        </Radio.Group>

                        <Radio.Group
                          required
                          label="Is the back camera okay ?"
                          onChange={(selection) =>
                            setBuyBack({
                              ...buyBack,
                              backCamOk: selection == "yes" ? true : false,
                            })
                          }
                          value={buyBack?.backCamOk ? "yes" : "no"}
                          withAsterisk
                        >
                          <Group mt="xs">
                            <Radio
                              value="yes"
                              className="border p-4 rounded-md"
                              label="Yes"
                            />
                            <Radio
                              value="no"
                              className="border p-4 rounded-md"
                              label="No"
                            />
                          </Group>
                        </Radio.Group>

                        <Radio.Group
                          required
                          label="Is the earpiece okay ?"
                          onChange={(selection) =>
                            setBuyBack({
                              ...buyBack,
                              earpieceOk: selection == "yes" ? true : false,
                            })
                          }
                          value={buyBack?.earpieceOk ? "yes" : "no"}
                          withAsterisk
                        >
                          <Group mt="xs">
                            <Radio
                              value="yes"
                              className="border p-4 rounded-md"
                              label="Yes"
                            />
                            <Radio
                              value="no"
                              className="border p-4 rounded-md"
                              label="No"
                            />
                          </Group>
                        </Radio.Group>

                        <Radio.Group
                          required
                          label="Is the mouthpiece okay ?"
                          onChange={(selection) =>
                            setBuyBack({
                              ...buyBack,
                              mouthpieceOk: selection == "yes" ? true : false,
                            })
                          }
                          value={buyBack?.mouthpieceOk ? "yes" : "no"}
                          withAsterisk
                        >
                          <Group mt="xs">
                            <Radio
                              value="yes"
                              className="border p-4 rounded-md"
                              label="Yes"
                            />
                            <Radio
                              value="no"
                              className="border p-4 rounded-md"
                              label="No"
                            />
                          </Group>
                        </Radio.Group>

                        <Radio.Group
                          required
                          label="Is the speaker okay ?"
                          onChange={(selection) =>
                            setBuyBack({
                              ...variant,
                              speakerOk: selection == "yes" ? true : false,
                            })
                          }
                          value={buyBack?.speakerOk ? "yes" : "no"}
                          withAsterisk
                        >
                          <Group mt="xs">
                            <Radio
                              value="yes"
                              className="border p-4 rounded-md"
                              label="Yes"
                            />
                            <Radio
                              value="no"
                              className="border p-4 rounded-md"
                              label="No"
                            />
                          </Group>
                        </Radio.Group>

                        <Radio.Group
                          required
                          label="Is the face ID or touch ID okay?"
                          onChange={(selection) =>
                            setBuyBack({
                              ...buyBack,
                              authorizationOk:
                                selection == "yes" ? true : false,
                            })
                          }
                          value={buyBack?.authorizationOk ? "yes" : "no"}
                          withAsterisk
                        >
                          <Group mt="xs">
                            <Radio
                              value="yes"
                              className="border p-4 rounded-md"
                              label="Yes"
                            />
                            <Radio
                              value="no"
                              className="border p-4 rounded-md"
                              label="No"
                            />
                          </Group>
                        </Radio.Group>

                        <Radio.Group
                          required
                          label="Is the SIM tray present ?"
                          onChange={(selection) =>
                            setBuyBack({
                              ...buyBack,
                              simTrayPresent: selection == "yes" ? true : false,
                            })
                          }
                          value={buyBack?.simTrayPresent ? "yes" : "no"}
                          withAsterisk
                        >
                          <Group mt="xs">
                            <Radio
                              value="yes"
                              className="border p-4 rounded-md"
                              label="Yes"
                            />
                            <Radio
                              value="no"
                              className="border p-4 rounded-md"
                              label="No"
                            />
                          </Group>
                        </Radio.Group>

                        <Radio.Group
                          required
                          label="Does the device charge?"
                          onChange={(selection) =>
                            setBuyBack({
                              ...buyBack,
                              chargingOk: selection == "yes" ? true : false,
                            })
                          }
                          value={buyBack?.chargingOk ? "yes" : "no"}
                          withAsterisk
                        >
                          <Group mt="xs">
                            <Radio
                              value="yes"
                              className="border p-4 rounded-md"
                              label="Yes"
                            />
                            <Radio
                              value="no"
                              className="border p-4 rounded-md"
                              label="No"
                            />
                          </Group>
                        </Radio.Group>
                      </div>
                    </Timeline.Item>

                    <Timeline.Item title="Offer">
                      <div>
                        <p>
                          The offer price sums up to :{" "}
                          {editable ? (
                            <NumberInput
                              min={0}
                              value={buyBack?.offer}
                              onBlur={() => setEditable(false)}
                              onChange={(val) =>
                                setBuyBack((_device) => ({
                                  ..._device,
                                  offer: val,
                                }))
                              }
                            />
                          ) : (
                            <span
                              className="font-bold hover:cursor-pointer"
                              onClick={() => setEditable(true)}
                            >
                              Ksh. {buyBack?.offer.toLocaleString("en-US")}
                            </span>
                          )}
                        </p>
                      </div>
                    </Timeline.Item>
                  </Timeline>
                  <br />

                  <Divider />
                  <br />

                  <Select
                    value={buyBack?.color}
                    withAsterisk
                    label="Color"
                    radius="md"
                    data={variantsData?.getVariants
                      ?.find(({ id }) => id == buyBack?.variant)
                      ?.colors?.map((color) => ({
                        label: color?.label,
                        value: color?.id,
                      }))}
                    onChange={(selection) =>
                      setBuyBack((_device) => ({
                        ..._device,
                        color: selection,
                      }))
                    }
                  />

                  <br />
                  <Checkbox
                    value={hasDefects}
                    onChange={(e) => setHasDefects(e.currentTarget.checked)}
                    label="This device has some defects"
                  />

                  {hasDefects && (
                    <div className="space-y-4 mt-4">
                      <p>
                        <IconInfoCircle
                          className="inline mr-1"
                          color="orange"
                          size={20}
                        />
                        <span className="text-[0.8rem] text-orange-500 ">
                          If there are no defects that should be repaired ,
                          leave &ldquo;Defects&ldquo; field below blank
                        </span>
                      </p>

                      <TagsInput
                        label="Defects"
                        value={buyBack?.defects}
                        radius="md"
                        data={[]}
                        onChange={(val) => {
                          setBuyBack((_device) => ({
                            ..._device,
                            defects: val,
                          }))
                        }}
                      />
                    </div>
                  )}
                  <br />

                  <TextInput
                    required
                    value={buyBack?.imei}
                    withAsterisk
                    label="IMEI"
                    radius="md"
                    onChange={(e) => {
                      setBuyBack((_device) => ({
                        ..._device,
                        imei: e.target.value,
                      }))
                    }}
                  />

                  <TextInput
                    required
                    value={buyBack?.serialNo}
                    withAsterisk
                    label="Serial number"
                    radius="md"
                    onChange={(e) => {
                      setBuyBack((_device) => ({
                        ..._device,
                        serialNo: e.target.value,
                      }))
                    }}
                  />

                  <Select
                    value={buyBack?.grade}
                    withAsterisk
                    label="Grade"
                    radius="md"
                    data={["A", "B", "C"]}
                    onChange={(selection) =>
                      setBuyBack((_device) => ({
                        ..._device,
                        grade: selection,
                      }))
                    }
                  />

                  <br />

                  <Button
                    onClick={handleAddDevice}
                    loading={loadingUpdate}
                    disabled={loadingUpdate}
                    fullWidth
                  >
                    Add device to inventory
                  </Button>
                </div>
              </Tabs.Panel>
              <Tabs.Panel value="cancel">
                <div className="py-6">
                  <p>
                    Are you sure you want to cancel this buyback request? This
                    action is not reversible
                  </p>

                  <br />
                  <Button.Group>
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={() => setModalOpened(false)}
                    >
                      No , go back
                    </Button>
                    <Button onClick={handleCancelBuyBack} fullWidth color="red">
                      Yes, cancel buyback
                    </Button>
                  </Button.Group>
                </div>
              </Tabs.Panel>
            </Tabs>
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
    },
    {
      field: "storage",
      valueGetter: ({ data }) =>
        data?.variant?.storages?.find(({ id }) => id == data?.storage)?.label,
      width: 90,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "offerPrice",
      width: 150,
      valueGetter: ({ data }) => data?.offer,
      valueFormatter: (p) => "Ksh." + p?.value?.toLocaleString(),
      filter: true,
      floatingFilter: true,
    },

    {
      field: "customerName",
      valueGetter: ({ data }) => data?.user?.name,
      filter: true,
      floatingFilter: true,
    },

    {
      field: "customerPhone",
      valueGetter: ({ data }) => data?.user?.phoneNumber,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "customerEmail",
      valueGetter: ({ data }) => data?.user?.email,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "createdOn",
      valueGetter: ({ data }) =>
        moment(new Date(parseInt(data?.createdAt))).format("Do MMM YYYY"),
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Status",
      filter: true,
      pinned: "right",
      floatingFilter: true,
      valueGetter: ({ data }) =>
        data?.cancelled
          ? "cancelled"
          : data?.payment?.timestamp
          ? "completed"
          : "new",
      cellRenderer: ({ value }) =>
        value == "cancelled" ? (
          <Badge radius={"sm"} mt={10} color="red">
            cancelled
          </Badge>
        ) : value == "completed" ? (
          <Badge radius={"sm"} mt={10} color="green">
            completed
          </Badge>
        ) : (
          <Badge radius={"sm"} mt={10} color="blue">
            new
          </Badge>
        ),
    },
    // {
    //   field: "completedOn",
    //   valueGetter: ({ data }) =>
    //     data?.completedOn
    //       ? moment(new Date(parseInt(data?.completedOn))).format("Do MMM YYYY")
    //       : null,
    //   filter: true,
    //   floatingFilter: true,
    // },

    {
      field: "",
      width: 60,
      cellRenderer: Actions,
      pinned: "right",
    },
  ]

  // Requests

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_TRADE_IN_REQUESTS,
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

    setLoadingCreate(true)

    _createDevice({
      serial: device?.serial,
      imei: device?.imei,
      variant: device?.variant,
      buyBackPrice: device?.buyBackPrice,
      grade: device?.grade,
      images: device?.images,
      publicAvailability: device?.websiteVisibility,
      saleId: null,
      saleReduction: null,
      saleValue: null,
      comesWith: null,
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
    <div>
      <div
        className="ag-theme-quartz mt-4" // applying the Data Grid theme
        style={{ height: height - 130 }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact rowData={data?.getBuyBacks} columnDefs={colDefs} />
      </div>
    </div>
  )
}

export default TradeInRequests
