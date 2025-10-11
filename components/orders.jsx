import {
  Accordion,
  ActionIcon,
  Badge,
  Button,
  Card,
  ColorSwatch,
  Divider,
  Drawer,
  Image,
  Rating,
  Text,
  Textarea,
  Timeline,
  Tooltip,
} from "@mantine/core"
import {
  IconCheck,
  IconChevronDown,
  IconCircleCheck,
  IconCircleCheckFilled,
  IconClipboard,
  IconCubeSend,
  IconReceipt,
  IconStarFilled,
  IconUpload,
  IconX,
} from "@tabler/icons-react"
import moment from "moment"
import { useRouter } from "next/router"
import React, { useState } from "react"
import styles from "../styles/Accordion.module.css"
import { useViewportSize } from "@mantine/hooks"
import { CldUploadWidget } from "next-cloudinary"
import { notifications } from "@mantine/notifications"
import { useMutation } from "urql"
import { useUser } from "@/context/User"
import { SAVE_REVIEW } from "@/lib/request"
import { ProductCard } from "."
import { useInfiniteHits } from "react-instantsearch"

function Orders({ orders, refreshApp }) {
  const { width } = useViewportSize()
  const router = useRouter()

  if (orders?.length > 0) {
    return (
      <div className="py-8 space-y-6">
        {orders.map((order, i) => (
          <Order order={order} key={i} refreshApp={refreshApp} />
        ))}
      </div>
    )
  }

  return (
    <div className="py-8 ">
      <div className="bg-white rounded-lg p-8 lg:flex lg:m-24">
        {width > 750 && <img src="/no-order.svg" className="mx-auto" />}

        <div>
          <h1 className="text-[1.4rem] font-semibold">
            It is pretty hard to believe
          </h1>
          <br />
          <p className="text-gray-600">
            But it looks like you haven&apos;t purchased anything on
            Shwariphones yet.
          </p>
          <br />
          {width < 750 && <img src="/no-order.svg" className="mx-auto" />}
          <br />
          <Button size="lg" fullWidth onClick={() => router.push("/all")}>
            Shop sweet deals
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Orders

const Order = ({ order, refreshApp }) => {
  const { user } = useUser()
  const [opened, setOpened] = useState(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [review, setReview] = useState("")
  const [reviewImg, setReviewImg] = useState(null)
  const { items, isLastPage, showMore } = useInfiniteHits()

  const [rating, setRating] = useState(0)

  let completed =
    order?.saleInfo?.delivery?.dispatchTime &&
    order?.saleInfo?.delivery?.collectionTime

  const primaryIndex =
    order?.variant?.colors?.find((color) => color["id"] == order?.color)
      ?.primaryIndex || 0

  const handleCloseReview = () => {
    setReviewOpen(false)
  }

  const [_, _saveReview] = useMutation(SAVE_REVIEW)
  const [saveReviewLoading, setSaveReviewLoading] = useState(false)

  const handleSaveReview = () => {
    if (!review) {
      notifications.show({
        title: "Review message empty",
        color: "orange",
      })
      return
    }

    setSaveReviewLoading(true)

    _saveReview({
      review,
      orderId: order?.id,
      image: reviewImg,
      rating,
    }).then(({ data }, error) => {
      if (data && !error) {
        notifications.show({
          title: "Review saved successfully",
          color: "green",
          icon: <IconCheck />,
        })
        setReview(""), setRating(0)
        setReviewImg(null)
        setReviewOpen(false)
        refreshApp()
        setSaveReviewLoading(false)
        return
      }

      notifications.show({
        title: "Error",
        message: "Could not save review",
        color: "red",
      })
      setSaveReviewLoading(false)
    })
  }

  return (
    <>
      <Accordion
        value={opened}
        onChange={setOpened}
        classNames={{ root: styles.root }}
      >
        <Accordion.Item value="tracking">
          <div className=" bg-white rounded-lg relative">
            {completed && (
              <div className="flex space-x-2 bg-green-200 rounded-md py-1 px-2 w-[120px]  absolute top-[-12px] right-[0px]">
                <IconCircleCheck size={20} />
                <span className="text-[0.8rem] ">Completed</span>
              </div>
            )}

            {order?.saleInfo?.payment?.timestamp &&
              !order?.saleInfo?.delivery?.dispatchTime &&
              !order?.saleInfo?.delivery?.collectionTime && (
                <div className="flex space-x-2 bg-blue-200 rounded-md py-1 px-2 w-[120px]  absolute top-[-12px] right-[0px]">
                  <IconReceipt size={20} />
                  <span className="text-[0.8rem] ">Processing</span>
                </div>
              )}

            {order?.saleInfo?.delivery?.dispatchTime &&
              !order?.saleInfo?.delivery?.collectionTime && (
                <div className="flex space-x-2 bg-orange-200 rounded-md py-1 px-2 w-[120px]  absolute top-[-12px] right-[0px]">
                  <IconCubeSend size={20} />
                  <span className="text-[0.8rem] ">In transit</span>
                </div>
              )}

            <br />
            <div className="flex  items-center justify-between">
              <div className="flex space-x-4 items-center">
                <div>
                  <img
                    className="h-[85px] w-auto object-contain"
                    src={
                      order?.variant?.colors?.find(
                        (color) => color["id"] == order?.color
                      )?.images[primaryIndex]
                    }
                  />
                </div>
                <div className="space-y-1">
                  <p className=" font-semibold ">
                    {order?.variant?.model} -{" "}
                    {
                      order?.variant?.storages?.find(
                        (storage) => storage["id"] == order?.storage
                      )?.label
                    }{" "}
                    -{" "}
                    {
                      order?.variant?.colors?.find(
                        (color) => color["id"] == order?.color
                      )?.label
                    }
                  </p>
                  <div className="flex space-x-2"></div>
                  <p className=" font-semibold text-slate-500 ">
                    Ksh.{" "}
                    {order?.saleInfo?.payment?.amount?.toLocaleString("en-US")}
                  </p>

                  {completed && !order?.review && (
                    <p
                      onClick={() => setReviewOpen(true)}
                      className="underline text-[#172554]"
                    >
                      Write us a review
                    </p>
                  )}

                  {completed && order?.review && (
                    <p
                      onClick={() => setOpened("tracking")}
                      className="hover:cursor-pointer underline text-green-700"
                    >
                      <span className="inline mr-1">
                        <IconCircleCheckFilled
                          size={16}
                          className="inline"
                          color="green"
                        />
                      </span>
                      Reviewed.See my review
                    </p>
                  )}
                </div>
              </div>

              <div>
                <ActionIcon
                  variant="transparent"
                  onClick={() =>
                    opened ? setOpened(null) : setOpened("tracking")
                  }
                >
                  <IconChevronDown
                    style={{
                      transform:
                        opened === "tracking"
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                    size={16}
                    stroke={1.2}
                  />
                </ActionIcon>
              </div>
            </div>
            <br />
          </div>

          <Accordion.Panel>
            <div className="lg:flex lg:space-x-8">
              <Timeline
                color="#002540"
                active={
                  order?.saleInfo?.delivery?.dispatchTime &&
                  !order?.saleInfo?.delivery?.collectionTime
                    ? 1
                    : completed
                    ? 3
                    : 0
                }
                bulletSize={12}
                lineWidth={2}
              >
                <Timeline.Item title={<p>Paid</p>}>
                  <p className="text-gray-500">
                    {moment(
                      new Date(parseInt(order?.saleInfo?.payment?.timestamp))
                    ).format("Do MMM")}
                  </p>
                </Timeline.Item>
                <Timeline.Item title={<p>Order dispatched , in transit now</p>}>
                  {order?.saleInfo?.delivery?.dispatchTime && (
                    <p className="text-gray-500">
                      {moment(
                        new Date(
                          parseInt(order?.saleInfo?.delivery?.dispatchTime)
                        )
                      ).format("Do MMM")}
                    </p>
                  )}
                </Timeline.Item>
                <Timeline.Item
                  title={
                    completed ? <p>Collected</p> : <p>Estimated delivery</p>
                  }
                >
                  <p className="text-gray-500">
                    {" "}
                    {completed
                      ? moment(
                          new Date(
                            parseInt(order?.saleInfo?.delivery?.collectionTime)
                          )
                        ).format("Do MMM")
                      : moment(
                          new Date(
                            parseInt(order?.saleInfo?.payment?.timestamp) +
                              172800000
                          )
                        ).format("Do MMM") +
                        "-" +
                        moment(
                          new Date(
                            parseInt(order?.saleInfo?.payment?.timestamp) +
                              2 * 172800000
                          )
                        ).format("Do MMM")}
                  </p>
                </Timeline.Item>
              </Timeline>

              <div className={!completed && "hidden"}>
                <Divider label="My review" />
                <br />

                {order?.review ? (
                  <Card
                    w={300}
                    className="hover:cursor-pointer mx-auto transition-all duration-200 hover:shadow-md"
                  >
                    <Card.Section>
                      <div className="relative min-h-[300px] bg-gradient-to-t from-black to-transparent">
                        {order?.review?.image ? (
                          <img
                            src={order?.review?.image}
                            className="h-[300px] object-cover"
                            alt="review"
                          />
                        ) : (
                          <div className="w-full h-[300px] bg-gray-200 flex items-center justify-center rounded-md text-gray-500 text-sm">
                            No Image Available
                          </div>
                        )}

                        <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                        <div className="absolute bottom-0 space-y-2 z-10 text-white p-6">
                          <Text size="xs" lineClamp={3}>
                            {order?.review?.review}
                          </Text>

                          <div className="flex items-center">
                            <Rating
                              value={parseInt(rating)}
                              fractions={2}
                              readOnly
                            />
                            <span className="text-[0.6rem] ml-3">
                              {order?.review?.rating}/5
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card.Section>
                  </Card>
                ) : (
                  <div className="w-full py-12">
                    <p
                      onClick={() => setReviewOpen(true)}
                      className="underline text-center w-full text-[#172554]"
                    >
                      Write us a review
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Drawer
        opened={reviewOpen}
        onClose={handleCloseReview}
        position={"bottom"}
        size={"90%"}
        title={
          <h1 className="font-bold font-duplet text-[1.2rem]">
            Rate your purchase!
          </h1>
        }
      >
        <div className="space-y-6 p-3">
          <p className=" text-[0.9rem]">
            How would you rate your new <strong>{order?.variant?.model}</strong>
            ?
          </p>

          <div className="flex w-full justify-center">
            <Rating size="lg" value={rating} onChange={setRating} />
          </div>
          <p className="w-full text-center">
            {rating}
            {rating == 1
              ? " star • 🥴 Oof"
              : rating == 2
              ? " star • 🪫 Low vibe"
              : rating == 3
              ? " star • 😌 Not bad"
              : rating == 4
              ? " star • 😎 Solid"
              : " star • 💎 Perfect!"}
          </p>

          <Textarea
            minLength={6}
            label="We'd love to hear your thoughts!"
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />

          {reviewImg ? (
            <div>
              <div className="flex flex-wrap gap-4">
                <div className="relative mt-8">
                  <div className="top-[-16px] right-[0px] absolute">
                    <Button
                      p={0}
                      radius={32}
                      w={32}
                      h={32}
                      color="red"
                      onClick={() => setReviewImg(null)}
                    >
                      <IconX />
                    </Button>
                  </div>
                  <img src={`${reviewImg}`} className=" w-full" alt={`image`} />
                </div>
              </div>
            </div>
          ) : (
            <CldUploadWidget
              uploadPreset="shwariphones"
              onSuccess={(result, { widget }) => {
                setReviewImg(result?.info?.secure_url)
              }}
              onQueuesEnd={(result, { widget }) => {
                widget.close()
              }}
            >
              {({ open }) => {
                function handleOnClick() {
                  setReviewImg(null)
                  open()
                }
                return (
                  <div
                    onClick={handleOnClick}
                    className=" w-full relative aspect-square border border-dashed bg-gray-200 items-center"
                  >
                    <div className="font-semibold space-y-4 w-4/5 absolute top-[50%] right-[50%] translate-y-[-50%] translate-x-[50%]">
                      <p className="w-full text-center text-[2rem] font-light">
                        +
                      </p>
                      <p className="w-full text-center">
                        Upload product images (optional)
                      </p>
                    </div>
                  </div>
                )
              }}
            </CldUploadWidget>
          )}

          <br />
          <Button
            loading={saveReviewLoading}
            disabled={saveReviewLoading}
            onClick={handleSaveReview}
            fullWidth
          >
            Send review
          </Button>
        </div>
      </Drawer>
    </>
  )
}
