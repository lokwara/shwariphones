import { useUser } from "@/context/User"
import { CREATE_CAROUSEL, GET_CAROUSELS, REMOVE_CAROUSEL } from "@/lib/request"
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Menu,
  Modal,
  Popover,
  TextInput,
  Tooltip,
} from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { notifications } from "@mantine/notifications"
import {
  IconCheck,
  IconDotsVertical,
  IconExclamationMark,
  IconInfoCircle,
  IconPlus,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react"
import moment from "moment"
import { CldUploadWidget } from "next-cloudinary"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import React, { useState } from "react"
import { useMutation, useQuery } from "urql"

function Carousels() {
  // Getting carousels

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_CAROUSELS,
  })

  // Creating a carousel
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [newCarouselOpen, setNewCarouselOpen] = useState(false)
  const [carousel, setCarousel] = useState({
    smallScreen: null,
    largeScreen: null,
    link: null,
    createdBy: user?.id,
  })

  const [_, _createCarousel] = useMutation(CREATE_CAROUSEL)

  const handleOnCloseModal = () => {
    setNewCarouselOpen(false)
    setCarousel({ smallScreen: null, largeScreen: null, link: null })
  }

  const handleCreateCarousel = () => {
    setLoading(true)

    _createCarousel(carousel)
      .then(({ data, error }) => {
        if (data && !error) {
          notifications.show({
            color: "green",
            icon: <IconCheck />,
            title: "Carousel saved successfully",
          })
          handleOnCloseModal()
          reexecuteQuery()
        } else {
          notifications.show({
            color: "orange",
            icon: <IconExclamationMark />,
            title: "Something ocuured",
            message: "The carousel was not saved",
          })
        }
      })
      .catch((err) => {
        notifications.show({
          color: "orange",
          icon: <IconExclamationMark />,
          title: "Something ocuured",
          message: "The carousel was not saved",
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // Deleting a carousel

  const [__, _removeCarousel] = useMutation(REMOVE_CAROUSEL)

  const handleRemoveCarousel = (id) => {
    _removeCarousel({ removeCarouselId: id })
    reexecuteQuery()
  }

  return (
    <div className="bg-slate-100 p-8 w-full h-screen relative">
      <h1 className="text-xl font-bold">Carousels</h1>
      <br />

      <div>
        <div className="grid grid-cols-4 gap-8">
          {data?.getCarousels?.map((carousel, i) => (
            <CarouselDisplay
              canRemove={user?.adminRights?.includes("CAROUSEL_MANAGEMENT")}
              key={i}
              carousel={carousel}
              handleRemoveCarousel={handleRemoveCarousel}
            />
          ))}
        </div>
        <br />

        {user?.adminRights?.includes("CAROUSEL_MANAGEMENT") && (
          <div className="fixed bottom-8 right-8">
            <Button
              p={0}
              w={50}
              h={50}
              radius={50}
              onClick={() => setNewCarouselOpen(true)}
            >
              <IconPlus />
            </Button>
          </div>
        )}

        <Modal
          size="80%"
          centered
          opened={newCarouselOpen}
          onClose={handleOnCloseModal}
          title={<h1 className="font-bold p-4 text-[1.2rem]">New carousel</h1>}
        >
          <div className="space-y-4 p-4">
            {carousel?.smallScreen ? (
              <div>
                <p className="font-medium text-[0.9rem]">Small screen image</p>
                <div className="mb-2">
                  <IconInfoCircle className="inline" size={16} color="gray" />{" "}
                  <span className="text-[0.7rem] text-slate-500">
                    The image that displays on small screen devices i.e mobile
                    phones.
                  </span>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="relative mt-8">
                    <div className="top-[-16px] right-[-16px] absolute">
                      <Button
                        p={0}
                        radius={32}
                        w={32}
                        h={32}
                        color="red"
                        onClick={() =>
                          setCarousel({ ...carousel, smallScreen: null })
                        }
                      >
                        <IconX />
                      </Button>
                    </div>
                    <img
                      src={`${carousel?.smallScreen}`}
                      className="h-[200px]"
                      alt={`image`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <CldUploadWidget
                uploadPreset="shwariphones"
                onSuccess={(result, { widget }) => {
                  setCarousel((prev) => ({
                    ...prev,
                    smallScreen: result?.info?.secure_url,
                  }))
                }}
                onQueuesEnd={(result, { widget }) => {
                  widget.close()
                }}
              >
                {({ open }) => {
                  function handleOnClick() {
                    setCarousel((prev) => ({ ...prev, smallScreen: null }))
                    open()
                  }
                  return (
                    <div>
                      <p className="font-medium text-[0.9rem]">
                        Small screen image (1:1 aspect ratio)
                      </p>
                      <div className="mb-2">
                        <IconInfoCircle
                          className="inline"
                          size={16}
                          color="gray"
                        />{" "}
                        <span className="text-[0.7rem] text-slate-500">
                          The image that displays on small screen devices i.e
                          mobile phones
                        </span>
                      </div>

                      <Button
                        fullWidth
                        variant="outline"
                        color="dark"
                        size="lg"
                        leftSection={<IconUpload size={16} />}
                        onClick={handleOnClick}
                      >
                        <p> Upload image</p>
                      </Button>
                    </div>
                  )
                }}
              </CldUploadWidget>
            )}

            {carousel?.largeScreen ? (
              <div>
                <p className="font-medium text-[0.9rem]">Large screen image </p>
                <div className="mb-2">
                  <IconInfoCircle className="inline" size={16} color="gray" />{" "}
                  <span className="text-[0.7rem] text-slate-500">
                    The image that displays on large screen devices i.e laptops,
                    tablets
                  </span>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="relative">
                    <div className="top-[-16px] right-[-16px] absolute">
                      <Button
                        p={0}
                        radius={32}
                        w={32}
                        h={32}
                        color="red"
                        onClick={() =>
                          setCarousel({ ...carousel, largeScreen: null })
                        }
                      >
                        <IconX />
                      </Button>
                    </div>
                    <img
                      src={`${carousel?.largeScreen}`}
                      className="h-[300px] object-contain"
                      alt={`image`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <CldUploadWidget
                uploadPreset="shwariphones"
                onSuccess={(result, { widget }) => {
                  setCarousel((prev) => ({
                    ...prev,
                    largeScreen: result?.info?.secure_url,
                  }))
                }}
                onQueuesEnd={(result, { widget }) => {
                  widget.close()
                }}
              >
                {({ open }) => {
                  function handleOnClick() {
                    setCarousel((prev) => ({ ...prev, largeScreen: null }))
                    open()
                  }
                  return (
                    <div>
                      <p className="font-medium text-[0.9rem]">
                        Large screen image (21:9 aspect ratio)
                      </p>
                      <div className="mb-2">
                        <IconInfoCircle
                          className="inline"
                          size={16}
                          color="gray"
                        />{" "}
                        <span className="text-[0.7rem] text-slate-500">
                          The image that displays on large screen devices i.e
                          laptops and tablets.
                        </span>
                      </div>

                      <Button
                        fullWidth
                        variant="outline"
                        color="dark"
                        size="lg"
                        leftSection={<IconUpload size={16} />}
                        onClick={handleOnClick}
                      >
                        <p> Upload image</p>
                      </Button>
                    </div>
                  )
                }}
              </CldUploadWidget>
            )}

            <TextInput
              label="Asset link"
              value={carousel?.link}
              onChange={(e) =>
                setCarousel({ ...carousel, link: e.target.value })
              }
              placeholder="ex. www.shwariphones.africa/product/ed24-45df"
            />

            <br />

            {carousel?.smallScreen && carousel?.largeScreen && (
              <Button
                onClick={handleCreateCarousel}
                loading={loading}
                disabled={loading}
                fullWidth
              >
                Save carousel
              </Button>
            )}
          </div>
        </Modal>
      </div>
    </div>
  )
}

const CarouselDisplay = ({ carousel, handleRemoveCarousel, canRemove }) => {
  return (
    <div className="col-span-1 bg-white p-2 space-y-2 relative">
      <Tooltip label={carousel?.link}>
        <Image
          src={carousel?.smallScreen}
          width={250}
          height={250}
          alt={`image`}
        />
      </Tooltip>
      <div className="flex items-center space-x-2">
        <Avatar src={carousel?.createdBy?.image} size={24} />
        <p className="text-slate-500 text-[0.6rem]">
          Created by <strong>{carousel?.createdBy?.name}</strong> on{" "}
          <strong>
            {moment(new Date(parseInt(carousel?.createdAt))).format(
              "Do MMM YYYY"
            )}
          </strong>
        </p>
      </div>

      {canRemove && (
        <Popover width={300} position="bottom" withArrow shadow="md">
          <Popover.Target>
            <div className="absolute top-[-12px] right-0">
              <ActionIcon size={20} color="red">
                <IconTrash size={12} />
              </ActionIcon>
            </div>
          </Popover.Target>
          <Popover.Dropdown>
            <div className="space-y-2 p-2">
              <strong>Confirm deletion</strong>
              <p className="text-slate-500">
                Are you sure you want to remove this carousel. This action is
                irreversible.
              </p>

              <Button
                fullWidth
                size="xs"
                onClick={() => handleRemoveCarousel(carousel?.id)}
              >
                Yes, remove
              </Button>
            </div>
          </Popover.Dropdown>
        </Popover>
      )}
    </div>
  )
}

export default Carousels
