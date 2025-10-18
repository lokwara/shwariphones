import {
  Badge,
  Button,
  Code,
  ColorInput,
  ColorSwatch,
  Divider,
  Modal,
  MultiSelect,
  Select,
  Tabs,
  NumberInput,
  TextInput,
  Checkbox,
  Radio,
  Text,
} from "@mantine/core"
import React, { useState } from "react"
import { AgGridReact } from "ag-grid-react"
import { useViewportSize } from "@mantine/hooks"
import {
  IconCheck,
  IconDotsVertical,
  IconExclamationMark,
  IconInfoCircle,
  IconPlus,
  IconUpload,
  IconX,
} from "@tabler/icons-react"
import { useMutation, useQuery } from "urql"
import {
  CREATE_VARIANT,
  GET_VARIANTS,
  REMOVE_VARIANT,
  UPDATE_VARIANT,
} from "@/lib/request"
import { notifications } from "@mantine/notifications"
// import NumberInput from "../../NumberInput";
import { useUser } from "@/context/User"

import { useRouter } from "next/router"
import Loader from "@/components/loader"
import Image from "next/image"
import { CldUploadWidget } from "next-cloudinary"

const Variants = () => {
  const { user } = useUser()

  const router = useRouter()

  // Mantine hooks

  const { height } = useViewportSize()

  // States

  const [newVariantModal, setNewVariantModal] = useState(false)

  const [variant, setVariant] = useState({
    tradeInAllowed: false,
    deviceType: "",
    brand: "",
    model: "",
    technicalSpecifications: [],
    basePrice: null,
    screenCost: null,
    bodyCost: null,
    frontCamCost: null,
    backCamCost: null,
    earpieceCost: null,
    mouthpieceCost: null,
    speakerCost: null,
    authCost: null,
    simTrayCost: null,
    motherBoardCost: null,
    batteryCost: null,
    colors: [],
    storages: [],
    financing: [],
  })

  const [newColor, setNewColor] = useState(false)

  const [colorLabel, setColorLabel] = useState("")
  const [colorCode, setColorCode] = useState("")
  const [colorImages, setColorImages] = useState([])

  const [loadingCreate, setLoadingCreate] = useState(false)
  const [newStorage, setNewStorage] = useState(false)

  const [newTs, setNewTs] = useState(false)
  const [tsLabel, setTsLabel] = useState("")
  const [tsValue, setTsValue] = useState("")

  const [storageLabel, setStorageLabel] = useState("")
  const [storagePrice, setStoragePrice] = useState(null)

  // Requests

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_VARIANTS,
  })

  const [_, _createVariant] = useMutation(CREATE_VARIANT)

  // Functions

  const handleCloseVariantModal = () => {
    setNewVariantModal(false)
    setVariant({
      brand: "",
      model: "",
      storage: [],
      color: [],
      basePrice: 0,
      screenCost: 0,
      backlidCost: 0,
      cameraCost: 0,
      meCost: 0,
      batteryCost: 0,
      technicalSpecifications: [],
    })
    return
  }

  const handleColorInput = () => {
    if (!colorCode || !colorLabel || colorImages?.length < 1) {
      notifications.show({
        title: "Missing fields / images",
        message:
          "Make sure all fields are filled and at least 1 image has been selected",
        color: "orange",
      })
      return
    }

    setVariant((prev) => ({
      ...prev,
      colors: [
        ...(prev?.colors ?? []),
        { label: colorLabel, colorCode: colorCode, images: colorImages },
      ],
    }))
    setColorLabel("")
    setColorCode("")
    setColorImages([])
    setNewColor(false)
  }

  const handleTsInput = () => {
    if (!tsLabel || !tsValue) {
      notifications.show({
        title: "Missing fields",
        color: "orange",
        message: "Ensure the label and the value fields are filled",
      })
      return
    }

    setVariant((prev) => ({
      ...prev,
      technicalSpecifications: [
        ...(prev?.technicalSpecifications ?? []),
        { label: tsLabel, value: tsValue },
      ],
    }))
    setTsLabel("")
    setTsValue("")
    setNewTs(false)
  }

  const handleStorageInput = () => {
    if (!storageLabel || !storagePrice) {
      notifications.show({
        title: "Missing fields",
        color: "orange",
        message: "Ensure the label and the price fields are filled",
      })
      return
    }
    setVariant((prev) => ({
      ...prev,
      storages: [
        ...(prev?.storages ?? []),
        { label: storageLabel, price: storagePrice },
      ],
    }))
    setStorageLabel("")
    setStoragePrice(0)
    setNewStorage(false)
  }

  const handleRemoveTs = (index) => {
    setVariant((prev) => ({
      ...prev,
      technicalSpecifications: [
        ...prev?.technicalSpecifications.filter((s, i) => i !== index),
      ],
    }))
  }

  const handelRemoveStorage = (index) => {
    setVariant((_variant) => ({
      ..._variant,
      storages: [...variant?.storages.filter((s, i) => i !== index)],
    }))
  }

  const handleRemoveColor = (index) => {
    setVariant((prev) => ({
      ...prev,
      colors: [...prev?.colors.filter((c, i) => i !== index)],
    }))
  }

  const handleSaveVariant = () => {
    setLoadingCreate(true)

    const payload = {
      tradeInAllowed: variant?.tradeInAllowed,
      deviceType: variant?.deviceType,
      brand: variant?.brand,
      model: variant?.model,
      technicalSpecifications: JSON.stringify(variant?.technicalSpecifications),

      screenCost: variant?.screenCost,
      bodyCost: variant?.bodyCost,
      frontCamCost: variant?.frontCamCost,
      backCamCost: variant?.backCamCost,
      earpieceCost: variant?.earpieceCost,
      mouthpieceCost: variant?.mouthpieceCost,
      speakerCost: variant?.speakerCost,
      authCost: variant?.authCost,
      simTrayCost: variant?.simTrayCost,
      motherBoardCost: variant?.motherBoardCost,
      batteryCost: variant?.batteryCost,

      colors: JSON.stringify(variant?.colors),
      storages: JSON.stringify(variant?.storages),
      financing: variant?.financing,
    }

    _createVariant(payload)
      .then(({ data, error }) => {
        if (data && !error) {
          notifications.show({
            title: "Success",
            message: "New variant saved successfully",
            icon: <IconCheck />,
            color: "green",
          })

          handleCloseVariantModal()

          router.reload()
        } else {
          notifications.show({
            title: "Error",
            message: "Error saving variant",
            icon: <IconExclamationMark />,
            color: "orange",
          })
        }
      })
      .catch((err) => {
        console.log(err)
        notifications.show({
          title: "Error",
          message: "Error saving variant",
          icon: <IconExclamationMark />,
          color: "orange",
        })
      })
      .finally(() => setLoadingCreate(false))
  }

  // AG grid renderers
  const Storages = ({ value }) => {
    return (
      <div className="space-x-2">
        {value?.map((storage, i) => (
          <Code key={i}>
            {storage?.label}(Ksh. {storage?.price?.toLocaleString("en-US")})
          </Code>
        ))}
      </div>
    )
  }

  const Colors = ({ value }) => {
    return (
      <div className="mt-[10px] flex overflow-x-auto gap-1 scrollbar-none scrollbar-track-transparent">
        {value?.map((c, i) => (
          <Badge variant="light" radius={"sm"} className="min-w-[60px]" key={i}>
            <div className="flex space-x-1 items-center">
              <ColorSwatch color={c?.colorCode} size={12} className="inline" />
              <span className="text-slate-800 text-[0.6rem] font-light normal-case">
                {c?.label}
              </span>
            </div>
          </Badge>
        ))}
      </div>
    )
  }

  const More = ({ data }) => {
    const [modalOpened, setModalOpened] = useState(false)

    // Removing a variant

    const [loadingRemove, setLoadingRemove] = useState(false)

    const [_, _removeVariant] = useMutation(REMOVE_VARIANT)

    const handleDeleteVariant = () => {
      setLoadingRemove(true)

      _removeVariant({
        removeVariantId: data?.id,
      })
        .then(({ data, error }) => {
          if (data && !error) {
            notifications.show({
              title: "Successs",
              message: "Successfully removed this variant",
              icon: <IconCheck />,
              color: "green",
            })
          } else {
            notifications.show({
              title: "Error",
              message: "Error removing variant",
              icon: <IconExclamationMark />,
              color: "orange",
            })
          }
        })
        .catch((err) => {
          notifications.show({
            title: "Error",
            message: "Error removing variant",
            icon: <IconExclamationMark />,
            color: "orange",
          })
        })
        .finally(() => setLoadingRemove(false))
    }

    // Editing a variant

    const [variant, setVariant] = useState({
      tradeInAllowed: data?.tradeInAllowed,
      deviceType: data?.deviceType,
      brand: data?.brand,
      model: data?.model,
      technicalSpecifications: data?.technicalSpecifications || [],

      screenCost: data?.screenCost,
      bodyCost: data?.bodyCost,
      frontCamCost: data?.frontCamCost,
      backCamCost: data?.backCamCost,
      earpieceCost: data?.earpieceCost,
      mouthpieceCost: data?.mouthpieceCost,
      speakerCost: data?.speakerCost,
      authCost: data?.authCost,
      simTrayCost: data?.simTrayCost,
      motherBoardCost: data?.motherBoardCost,
      batteryCost: data?.batteryCost,

      colors: data?.colors || [],
      storages: data?.storages || [],
      financing: data?.financing || [],
      featured: data?.featured,
    })

    const [newTs, setNewTs] = useState(false)
    const [tsLabel, setTsLabel] = useState("")
    const [tsValue, setTsValue] = useState("")

    const [loadingEdit, setLoadingEdit] = useState(false)

    const [____, _updateVariant] = useMutation(UPDATE_VARIANT)

    const handleEditvariant = (e) => {
      setLoadingEdit(true)

      _updateVariant({
        updateVariantId: data?.id,
        tradeInAllowed: variant?.tradeInAllowed,
        deviceType: variant?.deviceType,
        brand: variant?.brand,
        model: variant?.model,
        technicalSpecifications: JSON.stringify(
          variant?.technicalSpecifications
        ),
        basePrice: variant?.basePrice,
        screenCost: variant?.screenCost,
        bodyCost: variant?.bodyCost,
        frontCamCost: variant?.frontCamCost,
        backCamCost: variant?.backCamCost,
        earpieceCost: variant?.earpieceCost,
        mouthpieceCost: variant?.mouthpieceCost,
        speakerCost: variant?.speakerCost,
        authCost: variant?.authCost,
        simTrayCost: variant?.simTrayCost,
        motherBoardCost: variant?.motherBoardCost,
        batteryCost: variant?.batteryCost,
        colors: JSON.stringify(variant?.colors),
        storages: JSON.stringify(variant?.storages),
        financing: variant?.financing,
        featured: variant?.featured,
      })
        .then(({ data, error }) => {
          if (data && !error) {
            notifications.show({
              title: "Success",
              message: "Variant modified successfully",
              icon: <IconCheck />,
              color: "green",
            })

            setModalOpened(false)
            reexecuteQuery()
          } else {
            notifications.show({
              title: "Error",
              message: "Error saving variant",
              icon: <IconExclamationMark />,
              color: "orange",
            })
          }
        })
        .catch((err) => {
          notifications.show({
            title: "Error",
            message: "Error saving variant",
            icon: <IconExclamationMark />,
            color: "orange",
          })
        })
        .finally(() => setLoadingEdit(false))
    }

    const updatePropertyByIndex = (arr, index, property, newValue) => {
      return arr.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            [property]: newValue,
          }
        }

        return item
      })
    }

    const removeNestedElement = (mainArray, outerIndex, innerIndex) => {
      return mainArray.map((outerItem, i) => {
        if (i === outerIndex) {
          return {
            ...outerItem,

            images: outerItem?.images?.filter((_, j) => j !== innerIndex),
          }
        }
        return outerItem
      })
    }

    const addNestedElement = (mainArray, outerIndex, newElement) => {
      return mainArray.map((outerItem, i) => {
        if (i === outerIndex) {
          return {
            ...outerItem,
            images: [...outerItem.images, newElement],
          }
        }

        return outerItem
      })
    }

    const handleRemoveTs = (index) => {
      setVariant((prev) => ({
        ...prev,
        technicalSpecifications: [
          ...prev?.technicalSpecifications.filter((s, i) => i !== index),
        ],
      }))
    }

    const handleTsInput = () => {
      if (!tsLabel || !tsValue) {
        notifications.show({
          title: "Missing fields",
          color: "orange",
          message: "Ensure the label and the value fields are filled",
        })
        return
      }

      setVariant((prev) => ({
        ...prev,
        technicalSpecifications: [
          ...(prev?.technicalSpecifications ?? []),
          { label: tsLabel, value: tsValue },
        ],
      }))
      setTsLabel("")
      setTsValue("")
      setNewTs(false)
    }

    if (!user?.adminRights?.includes("EDIT_VARIANT")) return

    return (
      <div>
        <Button
          p={0}
          w={24}
          h={24}
          size="xs"
          variant="light"
          onClick={() => setModalOpened(true)}
        >
          <IconDotsVertical size={16} />
        </Button>

        <Modal
          size="auto"
          centered
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title={<h1 className="text-lg font-bold">{data?.model}</h1>}
        >
          <div className="p-2">
            <Tabs defaultValue="basic">
              <Tabs.List>
                <Tabs.Tab value="basic">Basic Information</Tabs.Tab>
                <Tabs.Tab value="delete">Remove</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="basic">
                <div className="p-2 space-y-4">
                  <div className="p-2 space-y-4">
                    <div>
                      <p className="text-[0.9rem] font-medium">
                        Featured product
                      </p>
                      <Text c="dimmed" size="xs">
                        By checking the box below you declare that this variant
                        will be showcased in the featured section to drive
                        it&apos;s sales
                      </Text>

                      <br />

                      <Checkbox
                        checked={variant?.featured}
                        onChange={(event) =>
                          setVariant((prev) => ({
                            ...prev,
                            featured: event.currentTarget.checked,
                          }))
                        }
                        label="I want to feature this variant"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[0.9rem] font-medium">
                        {variant?.deviceType === "Phone" ||
                        variant?.deviceType === "Macbook" ||
                        variant?.deviceType === "Tablets"
                          ? "Storage"
                          : "Label"}{" "}
                        options
                      </p>

                      {variant?.storages?.length > 0 && (
                        <div className="p-2 border space-y-2">
                          {variant?.storages?.map((storage, i) => (
                            <div
                              className="flex justify-between items-center"
                              key={i}
                            >
                              <div className="flex space-x-3 items-center justify-between">
                                <span className="text-[0.7rem]">
                                  {storage?.label} :{" "}
                                </span>

                                <NumberInput
                                  thousandSeparator
                                  min={0}
                                  value={storage?.price}
                                  onChange={(val) =>
                                    setVariant((prev) => ({
                                      ...prev,
                                      storages: updatePropertyByIndex(
                                        prev?.storages,
                                        i,
                                        "price",
                                        val
                                      ),
                                    }))
                                  }
                                  size="xs"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-[0.9rem] font-medium">Color options</p>

                      {variant?.colors?.length > 0 && (
                        <div className="p-2 border space-y-2">
                          {variant?.colors?.map((color, i) => (
                            <div key={i}>
                              {color?.primaryIndex == null &&
                                color?.images?.length > 0 && (
                                  <p className="text-[0.6rem] text-orange-400 mb-1">
                                    <IconInfoCircle
                                      className="inline mr-1"
                                      size={12}
                                    />
                                    <span>
                                      Select a primary color that displays as
                                      the first image or in product cards
                                    </span>
                                  </p>
                                )}
                              <div
                                className="flex justify-between items-center"
                                key={i}
                              >
                                <div className="grid grid-cols-7 items-center">
                                  <span className="text-[0.7rem] col-span-1">
                                    {color?.label}
                                  </span>
                                  <span className="col-span-1">
                                    <ColorSwatch
                                      size={14}
                                      color={color?.colorCode}
                                    />
                                  </span>
                                  <div className="flex space-x-2 col-span-4">
                                    <Radio.Group
                                      value={`${color?.primaryIndex}`}
                                      onChange={(index) => {
                                        setVariant((prev) => ({
                                          ...prev,
                                          colors: updatePropertyByIndex(
                                            variant?.colors,
                                            i,
                                            "primaryIndex",
                                            parseInt(index)
                                          ),
                                        }))
                                      }}
                                    >
                                      <div className="flex space-x-2">
                                        {color?.images?.map((id, j) => (
                                          <div
                                            className="relative min-w-[100px] mr-8"
                                            key={j}
                                          >
                                            <img
                                              key={j}
                                              src={`${id}`}
                                              className="h-[80px] w-[80px] object-contain mx-auto"
                                              alt={`image-${j}`}
                                            />
                                            <Radio.Card value={`${j}`}>
                                              <div className="absolute top-0 left-0">
                                                <Radio.Indicator />
                                              </div>
                                            </Radio.Card>

                                            <div className="absolute top-0 right-0">
                                              <Button
                                                radius={"lg"}
                                                onClick={() => {
                                                  const colors =
                                                    removeNestedElement(
                                                      variant?.colors,
                                                      i,
                                                      j
                                                    )

                                                  setVariant((prev) => ({
                                                    ...prev,
                                                    colors,
                                                  }))
                                                }}
                                                p={0}
                                                h={16}
                                                w={16}
                                                color="red"
                                              >
                                                <IconX size={12} />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </Radio.Group>
                                  </div>
                                  <CldUploadWidget
                                    uploadPreset="shwariphones"
                                    onSuccess={(result, { widget }) => {
                                      const colors = addNestedElement(
                                        variant?.colors,
                                        i,
                                        result?.info?.secure_url
                                      )

                                      setVariant((prev) => ({
                                        ...prev,
                                        colors,
                                      }))
                                    }}
                                    onQueuesEnd={(result, { widget }) => {
                                      widget.close()
                                    }}
                                  >
                                    {({ open }) => {
                                      function handleOnClick() {
                                        open()
                                      }
                                      return (
                                        <Button
                                          p={0}
                                          w={50}
                                          h={50}
                                          onClick={handleOnClick}
                                        >
                                          <p className="text-[0.5rem]">
                                            <IconUpload
                                              className="mx-auto mb-1"
                                              size={12}
                                            />
                                            <span>Upload</span>
                                          </p>
                                        </Button>
                                      )
                                    }}
                                  </CldUploadWidget>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-[0.9rem] font-medium">
                        Technical specifications
                      </p>

                      {variant?.technicalSpecifications?.length > 0 && (
                        <div className="p-2 border space-y-2">
                          {variant?.technicalSpecifications?.map((ts, i) => (
                            <div
                              className="flex justify-between items-center"
                              key={i}
                            >
                              <div className="flex space-x-3 items-center justify-between">
                                <span className="text-[0.7rem]">
                                  {ts?.label} :{" "}
                                </span>
                                <span className="text-[0.7rem]">
                                  {ts?.value}
                                </span>
                              </div>
                              <Button
                                radius={"lg"}
                                onClick={() => handleRemoveTs(i)}
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
                      {newTs && (
                        <div>
                          <div className="flex justify-between gap-2 w-full">
                            <TextInput
                              label="Label"
                              placeholder="ex. RAM"
                              size="xs"
                              value={tsLabel}
                              onChange={(e) => setTsLabel(e.target.value)}
                            />
                            <TextInput
                              label="Value"
                              placeholder="ex. 3GB"
                              size="xs"
                              value={tsValue}
                              onChange={(e) => setTsValue(e.target.value)}
                            />
                            <Button
                              className="mt-6"
                              onClick={handleTsInput}
                              size="xs"
                              variant="light"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        leftSection={<IconPlus size={20} />}
                        fullWidth
                        onClick={() => setNewTs(true)}
                      >
                        Add specification
                      </Button>
                    </div>

                    {(variant?.deviceType === "Phone" ||
                      variant?.deviceType === "Macbook" ||
                      variant?.deviceType === "Tablets" ||
                      variant?.deviceType === "Apple Watch") && (
                      <Checkbox
                        label="Device can be traded in"
                        checked={variant?.tradeInAllowed}
                        onChange={(event) =>
                          setVariant((prev) => ({
                            ...prev,
                            tradeInAllowed: event.currentTarget.checked,
                          }))
                        }
                      />
                    )}

                    {variant.tradeInAllowed && (
                      <div className="space-y-4">
                        <Divider
                          label="Trade in information"
                          labelPosition="right"
                        />

                        <p className="text-slate-500">
                          <IconInfoCircle className="inline mr-1" size={16} />
                          Information under this section is used to get pricing
                          for trade ins. Be careful setting prices.
                        </p>

                        <NumberInput
                          thousandSeparator=","
                          prefix="Ksh."
                          min={0}
                          value={variant?.screenCost}
                          onChange={(val) =>
                            setVariant({ ...variant, screenCost: val })
                          }
                          label="Screen cost"
                        />

                        <NumberInput
                          thousandSeparator=","
                          prefix="Ksh."
                          min={0}
                          value={variant?.bodyCost}
                          onChange={(val) =>
                            setVariant({ ...variant, bodyCost: val })
                          }
                          label="Body cost"
                        />

                        <NumberInput
                          thousandSeparator=","
                          prefix="Ksh."
                          min={0}
                          value={variant?.frontCamCost}
                          onChange={(val) =>
                            setVariant({ ...variant, frontCamCost: val })
                          }
                          label="Front camera cost"
                        />

                        <NumberInput
                          thousandSeparator=","
                          prefix="Ksh."
                          min={0}
                          value={variant?.backCamCost}
                          onChange={(val) =>
                            setVariant({ ...variant, backCamCost: val })
                          }
                          label="Back camera cost"
                        />

                        <NumberInput
                          thousandSeparator=","
                          prefix="Ksh."
                          min={0}
                          value={variant?.earpieceCost}
                          onChange={(val) =>
                            setVariant({ ...variant, earpieceCost: val })
                          }
                          label="Earpiece cost"
                        />

                        <NumberInput
                          thousandSeparator=","
                          prefix="Ksh."
                          min={0}
                          value={variant?.mouthpieceCost}
                          onChange={(val) =>
                            setVariant({ ...variant, mouthpieceCost: val })
                          }
                          label="Mouthpiece cost"
                        />

                        <NumberInput
                          thousandSeparator=","
                          prefix="Ksh."
                          min={0}
                          value={variant?.speakerCost}
                          onChange={(val) =>
                            setVariant({ ...variant, speakerCost: val })
                          }
                          label="Speaker cost"
                        />

                        <NumberInput
                          thousandSeparator=","
                          prefix="Ksh."
                          min={0}
                          value={variant?.authCost}
                          onChange={(val) =>
                            setVariant({ ...variant, authCost: val })
                          }
                          label="Touch/Face ID cost"
                        />

                        <NumberInput
                          thousandSeparator=","
                          prefix="Ksh."
                          min={0}
                          value={variant?.simTrayCost}
                          onChange={(val) =>
                            setVariant({ ...variant, simTrayCost: val })
                          }
                          label="Sim tray cost"
                        />

                        <NumberInput
                          thousandSeparator=","
                          prefix="Ksh."
                          min={0}
                          value={variant?.motherBoardCost}
                          onChange={(val) =>
                            setVariant({ ...variant, motherBoardCost: val })
                          }
                          label="Motherboard cost"
                        />

                        <NumberInput
                          thousandSeparator=","
                          prefix="Ksh."
                          min={0}
                          value={variant?.batteryCost}
                          onChange={(val) =>
                            setVariant({ ...variant, batteryCost: val })
                          }
                          label="Battery cost"
                        />
                      </div>
                    )}

                    <Divider label="Financing options" labelPosition="right" />

                    <MultiSelect
                      withAsterisk
                      label="Financing"
                      description="Financing companies that can finance this phone"
                      radius="md"
                      value={variant?.financing}
                      data={["buySimu", "chanteq"]}
                      onChange={(selection) => {
                        setVariant({
                          ...variant,
                          financing: selection,
                        })
                      }}
                    />

                    <br />

                    <Button
                      loading={loadingEdit}
                      disabled={loadingEdit}
                      fullWidth
                      onClick={handleEditvariant}
                    >
                      Edit variant
                    </Button>
                  </div>
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="delete">
                <div className="py-6">
                  <p>
                    Are you sure you want to completely remove this variant?
                    Devices under this variant will still have information about
                    this variant. However , you will not be able to add devices
                    of this variant
                  </p>

                  <br />
                  <Button.Group>
                    <Button fullWidth variant="outline">
                      No , go back
                    </Button>
                    <Button
                      onClick={handleDeleteVariant}
                      loading={loadingRemove}
                      disabled={loadingRemove}
                      fullWidth
                      color="red"
                    >
                      Yes, remove variant
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
      field: "brand",
      filter: true,
      floatingFilter: true,
    },
    {
      field: "model",
      width: 150,
      filter: true,
      floatingFilter: true,
      pinned: "left",
    },
    {
      field: "colors",
      width: 350,
      valueGetter: ({ data: { colors } }) => colors,
      filter: true,
      floatingFilter: true,
      cellRenderer: Colors,
    },
    {
      field: "storages/Labels & Price",
      valueGetter: ({ data: { storages } }) => storages,
      cellRenderer: Storages,
      filter: true,
      width: 250,
      floatingFilter: true,
    },
    {
      field: "screenCost",
      valueFormatter: ({ value }) =>
        value ? "Ksh." + value?.toLocaleString() : "Ksh." + 0,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "bodyCost",
      valueFormatter: ({ value }) =>
        value ? "Ksh." + value?.toLocaleString() : "Ksh." + 0,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "frontCamCost",
      headerName: "Front camera cost",
      valueFormatter: ({ value }) =>
        value ? "Ksh." + value?.toLocaleString() : "Ksh." + 0,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "backCamCost",
      headerName: "Back camera cost",
      valueFormatter: ({ value }) =>
        value ? "Ksh." + value?.toLocaleString() : "Ksh." + 0,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "earpieceCost",
      headerName: "Earpiece cost",
      valueFormatter: ({ value }) =>
        value ? "Ksh." + value?.toLocaleString() : "Ksh." + 0,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "mouthpieceCost",
      headerName: "Mouthpiece cost",
      valueFormatter: ({ value }) =>
        value ? "Ksh." + value?.toLocaleString() : "Ksh." + 0,
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Speaker cost",
      field: "speakerCost",
      valueFormatter: ({ value }) =>
        value ? "Ksh." + value?.toLocaleString() : "Ksh." + 0,
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Face/Touch ID cost",
      field: "authCost",
      valueFormatter: ({ value }) =>
        value ? "Ksh." + value?.toLocaleString() : "Ksh." + 0,
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Sim tray cost",
      field: "simTrayCost",
      valueFormatter: ({ value }) =>
        value ? "Ksh." + value?.toLocaleString() : "Ksh." + 0,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "motherBoardCost",
      headerName: "Motherboard cost",
      valueFormatter: ({ value }) =>
        value ? "Ksh." + value?.toLocaleString() : "Ksh." + 0,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "batteryCost",
      valueFormatter: ({ value }) =>
        value ? "Ksh." + value?.toLocaleString() : "Ksh." + 0,
      filter: true,
      floatingFilter: true,
    },

    {
      field: "",
      pinned: "right",
      cellRenderer: More,
      width: 60,
    },
  ]

  return (
    <div className="bg-slate-100 p-8 w-full h-screen relative">
      <h1 className="text-xl font-bold">Variants</h1>
      <br />

      {user?.adminRights?.includes("ADD_VARIANT") && (
        <div className="w-full flex justify-end">
          <Button
            variant="light"
            onClick={() => setNewVariantModal(true)}
            leftSection={<IconPlus />}
            className="justify-end"
          >
            Add new variant
          </Button>
        </div>
      )}

      <Modal
        size="40%"
        opened={newVariantModal}
        onClose={handleCloseVariantModal}
        centered
        title={<h1 className="text-lg font-bold">Add new variant</h1>}
      >
        <div className="p-2 space-y-4">
          <Select
            required
            value={variant?.deviceType}
            onChange={(selection) => {
              setVariant((prev) => ({ ...prev, deviceType: selection }))
            }}
            withAsterisk
            label="Product type"
            radius="md"
            data={[
              "Phone",
              "Macbook",
              "Apple Watch",
              "Airpods / Earphones",
              "Tablets",
              "Charger",
              "Phone case",
              "Gaming",
            ]}
          />

          <Select
            value={variant?.brand}
            onChange={(selection) =>
              setVariant((prev) => ({ ...prev, brand: selection }))
            }
            withAsterisk
            label="Brand"
            radius="md"
            data={["Apple", "Samsung", "Google Pixel", "OnePlus", "Sony"]}
          />

          <TextInput
            required
            value={variant?.model}
            withAsterisk
            label="Model"
            placeholder="ex. iPhone 11"
            radius="md"
            onChange={(e) => {
              setVariant((prev) => ({
                ...prev,
                model: e.target.value,
              }))
            }}
          />

          <div className="space-y-2">
            <p className="text-[0.9rem] font-medium">
              {variant?.deviceType === "Phone" ||
              variant?.deviceType === "Macbook" ||
              variant?.deviceType === "Tablets"
                ? "Storage"
                : "Label"}{" "}
              options
            </p>

            {variant?.storages?.length > 0 && (
              <div className="p-2 border space-y-2">
                {variant?.storages?.map((storage, i) => (
                  <div className="flex justify-between items-center" key={i}>
                    <div className="flex space-x-3 items-center justify-between">
                      <span className="text-[0.7rem]">{storage?.label} : </span>
                      <span className="text-[0.7rem]">
                        Ksh. {storage?.price?.toLocaleString("en-US")}
                      </span>
                    </div>
                    <Button
                      radius={"lg"}
                      onClick={() => handelRemoveStorage(i)}
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
            {newStorage && (
              <div className="flex justify-between gap-2 w-full">
                <TextInput
                  required
                  label="Label"
                  placeholder="ex. 32 GB"
                  size="xs"
                  value={storageLabel}
                  onChange={(e) => setStorageLabel(e.target.value)}
                />
                <NumberInput
                  required
                  value={storagePrice}
                  onChange={(val) => setStoragePrice(val)}
                  label="Price"
                  thousandSeparator
                  min={0}
                  size="xs"
                  prefix="Ksh."
                />

                <Button
                  className="mt-6"
                  onClick={handleStorageInput}
                  size="xs"
                  variant="light"
                >
                  Save
                </Button>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              leftSection={<IconPlus size={20} />}
              fullWidth
              onClick={() => setNewStorage(true)}
            >
              Add{" "}
              {variant?.deviceType === "Phone" ||
              variant?.deviceType === "Macbook" ||
              variant?.deviceType === "Tablets"
                ? "storage"
                : "label"}{" "}
              option
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-[0.9rem] font-medium">Color options</p>

            {variant?.colors?.length > 0 && (
              <div className="p-2 border space-y-2">
                {variant?.colors?.map((color, i) => (
                  <div className="flex justify-between items-center" key={i}>
                    <div className="grid grid-cols-7 items-center">
                      <span className="text-[0.7rem] col-span-1">
                        {color?.label}
                      </span>
                      <span className="col-span-1">
                        <ColorSwatch size={14} color={color?.colorCode} />
                      </span>
                      <div className="grid grid-cols-3 gap-8 col-span-4">
                        {color?.images?.map((id, i) => (
                          <Image
                            key={i}
                            src={`${id}`}
                            width={50}
                            height={50}
                            alt={`image-${i}`}
                          />
                        ))}
                      </div>
                    </div>
                    <Button
                      radius={"lg"}
                      onClick={() => handleRemoveColor(i)}
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

            {newColor && (
              <div>
                <div className="flex justify-between gap-2 w-full">
                  <TextInput
                    label="Label"
                    placeholder="ex. Starlight"
                    size="xs"
                    value={colorLabel}
                    onChange={(e) => setColorLabel(e.target.value)}
                  />
                  <ColorInput
                    label="Color code"
                    size="xs"
                    className="w-[40%]"
                    value={colorCode}
                    onChange={setColorCode}
                  />

                  <CldUploadWidget
                    uploadPreset="shwariphones"
                    onSuccess={(result, { widget }) => {
                      setColorImages((prev) => [
                        ...prev,
                        result?.info?.secure_url,
                      ])
                    }}
                    onQueuesEnd={(result, { widget }) => {
                      widget.close()
                    }}
                  >
                    {({ open }) => {
                      function handleOnClick() {
                        setColorImages([])
                        open()
                      }
                      return (
                        <Button
                          className="mt-6"
                          onClick={handleOnClick}
                          size="xs"
                          variant="light"
                        >
                          Upload
                        </Button>
                      )
                    }}
                  </CldUploadWidget>
                </div>

                <br />
                <p>Images</p>

                <br />

                {colorImages?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-8">
                    {colorImages?.map((id, i) => (
                      <div className="relative" key={i}>
                        <div className="top-[-16px] right-[-16px] absolute">
                          <Button
                            p={0}
                            radius={32}
                            w={32}
                            h={32}
                            color="red"
                            onClick={() =>
                              setColorImages((prev) => [
                                ...prev?.filter((img) => img != id),
                              ])
                            }
                          >
                            <IconX />
                          </Button>
                        </div>
                        <Image
                          src={`${id}`}
                          width={100}
                          height={100}
                          alt={`image-${i}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-orange-400 text-[0.7rem] flex items-center">
                    <IconInfoCircle className="mr-2" size={16} />
                    <span>No images selected yet</span>
                  </p>
                )}

                <Button
                  className="mt-6"
                  onClick={handleColorInput}
                  size="xs"
                  fullWidth
                  variant="light"
                >
                  Save
                </Button>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              leftSection={<IconPlus size={20} />}
              fullWidth
              onClick={() => setNewColor(true)}
            >
              Add color
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-[0.9rem] font-medium">
              Technical specifications
            </p>

            {variant?.technicalSpecifications?.length > 0 && (
              <div className="p-2 border space-y-2">
                {variant?.technicalSpecifications?.map((ts, i) => (
                  <div className="flex justify-between items-center" key={i}>
                    <div className="flex space-x-3 items-center justify-between">
                      <span className="text-[0.7rem]">{ts?.label} : </span>
                      <span className="text-[0.7rem]">{ts?.value}</span>
                    </div>
                    <Button
                      radius={"lg"}
                      onClick={() => handleRemoveTs(i)}
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
            {newTs && (
              <div>
                <div className="flex justify-between gap-2 w-full">
                  <TextInput
                    label="Label"
                    placeholder="ex. RAM"
                    size="xs"
                    value={tsLabel}
                    onChange={(e) => setTsLabel(e.target.value)}
                  />
                  <TextInput
                    label="Value"
                    placeholder="ex. 3GB"
                    size="xs"
                    value={tsValue}
                    onChange={(e) => setTsValue(e.target.value)}
                  />
                  <Button
                    className="mt-6"
                    onClick={handleTsInput}
                    size="xs"
                    variant="light"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              leftSection={<IconPlus size={20} />}
              fullWidth
              onClick={() => setNewTs(true)}
            >
              Add specification
            </Button>
          </div>

          {(variant?.deviceType === "Phone" ||
            variant?.deviceType === "Macbook" ||
            variant?.deviceType === "Tablets" ||
            variant?.deviceType === "Apple Watch") && (
            <Checkbox
              label="Device can be traded in"
              checked={variant?.tradeInAllowed}
              onChange={(event) =>
                setVariant((prev) => ({
                  ...prev,
                  tradeInAllowed: event.currentTarget.checked,
                }))
              }
            />
          )}

          {variant.tradeInAllowed && (
            <div className="space-y-4">
              <Divider label="Trade in information" labelPosition="right" />

              <p className="text-slate-500">
                <IconInfoCircle className="inline mr-1" size={16} />
                Information under this section is used to get pricing for trade
                ins. Be careful setting prices.
              </p>

              <NumberInput
                thousandSeparator=","
                prefix="Ksh."
                min={0}
                value={variant?.screenCost}
                onChange={(val) => setVariant({ ...variant, screenCost: val })}
                label="Screen cost"
              />

              <NumberInput
                thousandSeparator=","
                prefix="Ksh."
                min={0}
                value={variant?.bodyCost}
                onChange={(val) => setVariant({ ...variant, bodyCost: val })}
                label="Body cost"
              />

              <NumberInput
                thousandSeparator=","
                prefix="Ksh."
                min={0}
                value={variant?.frontCamCost}
                onChange={(val) =>
                  setVariant({ ...variant, frontCamCost: val })
                }
                label="Front camera cost"
              />

              <NumberInput
                thousandSeparator=","
                prefix="Ksh."
                min={0}
                value={variant?.backCamCost}
                onChange={(val) => setVariant({ ...variant, backCamCost: val })}
                label="Back camera cost"
              />

              <NumberInput
                thousandSeparator=","
                prefix="Ksh."
                min={0}
                value={variant?.earpieceCost}
                onChange={(val) =>
                  setVariant({ ...variant, earpieceCost: val })
                }
                label="Earpiece cost"
              />

              <NumberInput
                thousandSeparator=","
                prefix="Ksh."
                min={0}
                value={variant?.mouthpieceCost}
                onChange={(val) =>
                  setVariant({ ...variant, mouthpieceCost: val })
                }
                label="Mouthpiece cost"
              />

              <NumberInput
                thousandSeparator=","
                prefix="Ksh."
                min={0}
                value={variant?.speakerCost}
                onChange={(val) => setVariant({ ...variant, speakerCost: val })}
                label="Speaker cost"
              />

              <NumberInput
                thousandSeparator=","
                prefix="Ksh."
                min={0}
                value={variant?.authCost}
                onChange={(val) => setVariant({ ...variant, authCost: val })}
                label="Touch/Face ID cost"
              />

              <NumberInput
                thousandSeparator=","
                prefix="Ksh."
                min={0}
                value={variant?.simTrayCost}
                onChange={(val) => setVariant({ ...variant, simTrayCost: val })}
                label="Sim tray cost"
              />

              <NumberInput
                thousandSeparator=","
                prefix="Ksh."
                min={0}
                value={variant?.motherBoardCost}
                onChange={(val) =>
                  setVariant({ ...variant, motherBoardCost: val })
                }
                label="Motherboard cost"
              />

              <NumberInput
                thousandSeparator=","
                prefix="Ksh."
                min={0}
                value={variant?.batteryCost}
                onChange={(val) => setVariant({ ...variant, batteryCost: val })}
                label="Battery cost"
              />
            </div>
          )}

          <Divider label="Financing options" labelPosition="right" />

          <MultiSelect
            withAsterisk
            label="Financing"
            description="Financing companies that can finance this phone"
            radius="md"
            value={variant?.financing}
            data={["buySimu", "chanteq"]}
            onChange={(selection) => {
              setVariant({
                ...variant,
                financing: selection,
              })
            }}
          />

          <br />

          <Button
            loading={loadingCreate}
            disabled={loadingCreate}
            fullWidth
            onClick={handleSaveVariant}
          >
            Save variant
          </Button>
        </div>
      </Modal>

      <div
        className="ag-theme-quartz mt-4" // applying the Data Grid theme
        style={{
          height: user?.adminRights?.includes("ADD_DEVICE")
            ? height - 170
            : height - 135,
        }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact rowData={data?.getVariants} columnDefs={colDefs} />
      </div>
    </div>
  )
}

export default Variants
