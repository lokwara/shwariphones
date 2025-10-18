import { CANCEL_BUYBACK } from "@/lib/request"
import {
  Accordion,
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Drawer,
  Group,
  Modal,
  Radio,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Timeline,
  UnstyledButton,
} from "@mantine/core"
import { useViewportSize } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import {
  IconArrowLeft,
  IconCheck,
  IconCircleCheck,
  IconInfoCircle,
  IconPhone,
} from "@tabler/icons-react"
import moment from "moment"
import Image from "next/image"
import { useRouter } from "next/router"
import React, { useState } from "react"
import { useMutation } from "urql"

const Info = ({ title, description }) => {
  return (
    <div className=" w-full bg-red-100 flex rounded-md space-x-4 p-4">
      <div>
        <IconInfoCircle />
      </div>
      <div className="space-y-2">
        <p className="font-semibold text-[0.9rem]">{title}</p>
        <p className="text-gray-500 text-[0.7rem]">{description}</p>
      </div>
    </div>
  )
}

function TradeIns({ tradeIns, refreshApp }) {
  const router = useRouter()
  const { width } = useViewportSize()

  if (tradeIns?.length > 0) {
    return (
      <div className="py-8 space-y-6">
        <strong>Here are devices you want to sell us :</strong>

        {tradeIns.map((device, i) => (
          <TradeIn key={i} device={device} />
        ))}

        <div className="flex justify-center">
          <Button
            size="md"
            className="inline mx-auto"
            fullWidth={width < 750}
            onClick={() => router.push("/new-tradein")}
          >
            New trade-in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 ">
      <div className="bg-white rounded-lg p-8 lg:flex lg:m-24">
        {width > 750 && <img src="/no-order.svg" className="mx-auto" />}

        <div>
          <h1 className="text-[1.4rem] font-semibold">
            We buy your used devices
          </h1>
          <br />
          <p className="text-gray-600">
            Get value from your old devices by simply selling it to us. Simply
            get started below
          </p>
          <br />
          {width < 750 && <img src="/no-order.svg" className="mx-auto" />}
          <br />
          <Button
            size="lg"
            fullWidth
            onClick={() => router.push("/new-tradein")}
          >
            Get started
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TradeIns

const TradeIn = ({ device }) => {
  const [openCancelConfirm, setOpenCancelConfirm] = useState(false)
  const [loadingCancel, setLoadingCancel] = useState(false)

  const [_, _cancelBuyBack] = useMutation(CANCEL_BUYBACK)

  const handleDeleteBuyBack = () => {
    setLoadingCancel(true)

    _cancelBuyBack({
      cancel: true,
      updateBuyBackId: device?.id,
    })
      .then(({ data }, error) => {
        if (data?.updateBuyBack && !error) {
          notifications.show({
            title: "Request cancelled successfully",
            color: "green",
            icon: <IconCheck />,
          })
        }
      })

      .finally(() => {
        setLoadingCancel(false)
        setOpenCancelConfirm(false)
      })
  }

  return (
    <Accordion className="bg-white ">
      <Accordion.Item value={device?.id}>
        <Accordion.Control>
          <div className="rounded-lg relative ">
            {device?.payment?.timestamp && (
              <div className="flex space-x-2 bg-[#A7EC37] rounded-md py-1 px-2 w-[120px]  absolute top-[-12px] right-[-12px]">
                <IconCircleCheck size={20} />
                <span className="text-[0.8rem] ">Completed</span>
              </div>
            )}
            <br />
            <div className=" flex gap-4 items-center">
              <div className="col-span-1">
                <Image
                  width={85}
                  height={85}
                  src={"/png/phone.avif"}
                  alt="deviceType"
                />
              </div>
              <div className=" space-y-2">
                <p className=" font-semibold ">
                  {device?.variant?.brand} {device?.variant?.model} -{" "}
                  {device?.screenCondition} screen -{" "}
                  {device?.sideNBackCondition} sides & back
                </p>
                <p className="text-[0.8rem]">
                  Offer :{" "}
                  <strong className="text-yellow-500">
                    Ksh. {device?.offer?.toLocaleString("en-US")}
                  </strong>
                </p>
              </div>
            </div>

            {!device?.payment?.timestamp && (
              <div className="items-center space-y-3 mt-3">
                <Badge radius={"xs"}>
                  <p className="normal-case font-light">Next step : </p>
                </Badge>
                <p>
                  Bring device to{" "}
                  <strong>Kimathi House , 4th floor , Suite 409</strong>
                </p>
              </div>
            )}
            <br />
          </div>
        </Accordion.Control>
        <Accordion.Panel>
          <Timeline
            color="yellow"
            active={device?.payment ? 2 : 1}
            bulletSize={12}
            lineWidth={2}
          >
            <Timeline.Item title={<p>Offer accepted</p>}>
              <p className="text-gray-500">
                {moment(new Date(parseInt(device?.createdAt))).format("Do MMM")}
              </p>
            </Timeline.Item>
            <Timeline.Item title={<p>Bring device</p>}>
              <p className="text-gray-500">
                {" "}
                Kimathi House , 4th floor , Suite 409
              </p>
            </Timeline.Item>
            <Timeline.Item
              title={
                device?.payment && device?.payment?.amount ? (
                  <p>Received payment</p>
                ) : (
                  <p>Receive payment / make a new purchase</p>
                )
              }
            >
              <p className="text-gray-500">
                {device?.payment &&
                device?.payment?.amount &&
                device?.payment?.timestamp
                  ? `${moment(
                      new Date(parseInt(device?.payment?.timestamp))
                    ).format(
                      "Do MMM"
                    )} • Ksh. ${device?.payment?.amount?.toLocaleString(
                      "en-US"
                    )}`
                  : null}
              </p>
            </Timeline.Item>
          </Timeline>

          <br />
          {!device?.payment?.timestamp && (
            <Button
              onClick={() => setOpenCancelConfirm(true)}
              fullWidth
              size="xs"
              variant="subtle"
              color="red"
            >
              Cancel trade-in request
            </Button>
          )}

          <Modal
            centered
            opened={openCancelConfirm}
            onClose={() => setOpenCancelConfirm(false)}
            title={<strong>Cancel trade-in request</strong>}
          >
            <div className="p-4">
              <p className="text-slate-700">
                Are you sure you want to cancel this trade-in request? This
                action is irreversible
              </p>
              <br />
              <Button.Group>
                <Button
                  variant="default"
                  fullWidth
                  onClick={() => setOpenCancelConfirm(false)}
                >
                  Back
                </Button>
                <Button
                  fullWidth
                  color="red"
                  loading={loadingCancel}
                  disabled={loadingCancel}
                  onClick={handleDeleteBuyBack}
                >
                  Yes, cancel
                </Button>
              </Button.Group>
            </div>
          </Modal>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}
