import {
  Alert,
  Button,
  Card,
  Divider,
  Group,
  NumberInput,
  Radio,
  Select,
  Stack,
  Tabs,
  UnstyledButton,
} from "@mantine/core"
import {
  IconArrowLeft,
  IconCheck,
  IconCircleCheck,
  IconExclamationMark,
  IconInfoCircle,
  IconInfoCircleFilled,
} from "@tabler/icons-react"
import React, { useState } from "react"
import models from "@/lib/models.json"
import { useRouter } from "next/router"
import { useMutation, useQuery } from "urql"
import {
  ADD_BUYBACK,
  COMPLETE_VERIFICATION,
  GET_VARIANTS,
  SEND_VERIFICATION_TOKEN,
} from "@/lib/request"
import { supabaseBrowser, useSupabaseSession } from "@/lib/supabaseBrowser"
import { notifications } from "@mantine/notifications"
import { useUser } from "@/context/User"

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

const Questionnaire = ({ goToOffer, variantsData }) => {
  const [loadingOffer, setLoadingOffer] = useState(false)
  const [variant, setVariant] = useState({
    brand: null,
    model: null,
    storage: null,
    batteryHealth: null,
    frontCamOk: false,
    backCamOk: false,
    earpieceOk: false,
    mouthpieceOk: false,
    speakerOk: false,
    authorizationOk: false,
    simTrayPresent: false,
    chargingOk: false,
    screenCondition: null,
    sideNBackCondition: null,
  })

  const handleSeeOffer = (e) => {
    e.preventDefault()

    if (
      !variant?.brand ||
      !variant?.model ||
      !variant?.storage ||
      !variant?.batteryHealth ||
      !variant?.screenCondition ||
      !variant?.sideNBackCondition
    ) {
      notifications.show({
        title: "Missing information",
        message: "Please verify that you have filled all fields",
        color: "orange",
      })
      return
    }

    const tradeInVariant = variantsData?.getVariants?.find(
      ({ id }) => id === variant?.model
    )

    const screenReplacement =
      variant?.screenCondition == ("cracked" || "used") ? true : false

    const bodyReplacement =
      variant?.sideNBackCondition == ("cracked" || "used") ? true : false

    const batteryReplacement =
      parseInt(variant?.batteryHealth) >= 95 ? false : true

    const offerPrice = () => {
      let price = Math.round(
        tradeInVariant?.storages?.find(({ id }) => id == variant?.storage)
          ?.price * 0.4
      )

      const deductions = [
        { condition: screenReplacement, cost: tradeInVariant?.screenCost || 0 },
        { condition: bodyReplacement, cost: tradeInVariant?.bodyCost || 0 },
        {
          condition: batteryReplacement,
          cost: tradeInVariant?.batteryCost || 0,
        },
        {
          condition: !variant?.frontCamOk,
          cost: tradeInVariant?.frontCamCost || 0,
        },
        {
          condition: !variant?.backCamOk,
          cost: tradeInVariant?.backCamCost || 0,
        },
        {
          condition: !variant?.earpieceOk,
          cost: tradeInVariant?.earpieceCost || 0,
        },
        {
          condition: !variant?.mouthpieceOk,
          cost: tradeInVariant?.mouthpieceCost || 0,
        },
        {
          condition: !variant?.speakerOk,
          cost: tradeInVariant?.speakerCost || 0,
        },
        {
          condition: !variant?.authorizationOk,
          cost: tradeInVariant?.authCost || 0,
        },
        {
          condition: !variant?.simTrayPresent,
          cost: tradeInVariant?.simTrayCost || 0,
        },
        {
          condition: !variant?.chargingOk,
          cost: tradeInVariant?.motherBoardCost || 0,
        },
      ]

      deductions.forEach(({ condition, cost }) => {
        if (condition) price -= cost
      })

      return price
    }

    setLoadingOffer(true)
    let buyBackPrice = offerPrice()

    setTimeout(() => {
      setLoadingOffer(false)
      goToOffer(variant, buyBackPrice)
    }, 1000)
  }

  return (
    <form onSubmit={handleSeeOffer} className="space-y-4">
      <Select
        value={variant?.brand}
        onChange={(selection) =>
          setVariant((_variant) => ({
            ..._variant,
            brand: selection,
            storage: null,
            model: null,
          }))
        }
        withAsterisk
        label="What brand is your smartphone ?"
        description="Please select one"
        radius="md"
        required
        data={["Apple", "Samsung", "Google Pixel", "OnePlus"]}
      />
      <Select
        withAsterisk
        label="What model is your smartphone ?"
        required
        radius="md"
        value={variant?.model}
        data={variantsData?.getVariants
          ?.filter(
            (_variant) =>
              variant?.brand == _variant?.brand && _variant?.tradeInAllowed
          )
          .map((variant) => ({
            label: variant?.model,
            value: variant?.id,
          }))}
        onChange={(selection) => {
          setVariant((_variant) => ({
            ..._variant,
            model: selection,
            storage: null,
          }))
        }}
      />
      <Select
        withAsterisk
        value={variant?.storage}
        label="What is your smartphone's storage capacity?"
        required
        radius="md"
        data={variantsData?.getVariants
          ?.find((_variant) => _variant["id"] == variant?.model)
          ?.storages?.map(({ label, id }) => ({ label, value: id }))}
        onChange={(selection) =>
          setVariant((_variant) => ({
            ..._variant,
            storage: selection,
          }))
        }
      />

      <Radio.Group
        required
        onChange={(selection) =>
          setVariant({
            ...variant,
            screenCondition: selection,
          })
        }
        value={variant?.screenCondition}
        label="How does the screen look ?"
        withAsterisk
      >
        <Stack mt="xs">
          <Radio
            value="cracked"
            label="Cracked"
            className="border p-4 rounded-md"
            description="Has one or more cracks and may or may not be 100% functional."
          />
          <Radio
            value="used"
            label="Used"
            className="border p-4 rounded-md"
            description="Visible signs of wear, including deep scratches and/or dents on the outside of the device, which do not affect its functionality. No cracks. Screen has no defective pixels (e.g. ghost touch, screen burn-in, dead pixels) and the touchscreen works."
          />
          <Radio
            value="good"
            label="Good"
            className="border p-4 rounded-md"
            description="A few faint signs of wear, not noticeable from 8 inches away. No cracks or dents. Screen has no defective pixels (e.g. ghost touch, screen burn-in, dead pixels) and the touchscreen works."
          />
          <Radio
            value="flawless"
            label="Flawless"
            className="border p-4 rounded-md"
            description="Flawless appearance with no visible scratches. Screen has no defective pixels (e.g. ghost touch, screen burn-in, dead pixels), and the touchscreen works."
          />
        </Stack>
      </Radio.Group>

      <Radio.Group
        required
        onChange={(selection) =>
          setVariant({
            ...variant,
            sideNBackCondition: selection,
          })
        }
        value={variant?.sideNBackCondition}
        label="How does the sides and back look ?"
        withAsterisk
      >
        <Stack mt="xs">
          <Radio
            value="cracked"
            label="Cracked"
            className="border p-4 rounded-md"
            description="Shows visible signs of wear, including deep scratches, cracks and/or dents on the outside of the item."
          />
          <Radio
            value="used"
            label="Used"
            className="border p-4 rounded-md"
            description="Visible signs of wear, including deep scratches and/or dents on the outside of the device, which do not affect its functionality. No cracks."
          />
          <Radio
            value="good"
            label="Good"
            className="border p-4 rounded-md"
            description="A few faint signs of wear, not noticeable from 8 inches away. No cracks or dents."
          />
          <Radio
            value="flawless"
            label="Flawless"
            className="border p-4 rounded-md"
            description="Flawless appearance with no visible scratches."
          />
        </Stack>
      </Radio.Group>

      {variant?.brand == "Apple" ? (
        <NumberInput
          radius="md"
          withAsterisk
          required
          suffix="%"
          label="Battery health"
          min={0}
          max={100}
          value={variant?.batteryHealth}
          onChange={(batteryHealth) =>
            setVariant({ ...variant, batteryHealth })
          }
        />
      ) : (
        <Select
          value={variant?.batteryHealth}
          onChange={(selection) =>
            setVariant({
              ...variant,
              batteryHealth: selection,
            })
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
          setVariant({
            ...variant,
            frontCamOk: selection == "yes" ? true : false,
          })
        }
        value={variant?.frontCamOk ? "yes" : "no"}
        withAsterisk
      >
        <Group mt="xs">
          <Radio value="yes" className="border p-4 rounded-md" label="Yes" />
          <Radio value="no" className="border p-4 rounded-md" label="No" />
        </Group>
      </Radio.Group>

      <Radio.Group
        required
        label="Is the back camera okay ?"
        onChange={(selection) =>
          setVariant({
            ...variant,
            backCamOk: selection == "yes" ? true : false,
          })
        }
        value={variant?.backCamOk ? "yes" : "no"}
        withAsterisk
      >
        <Group mt="xs">
          <Radio value="yes" className="border p-4 rounded-md" label="Yes" />
          <Radio value="no" className="border p-4 rounded-md" label="No" />
        </Group>
      </Radio.Group>

      <Radio.Group
        required
        label="Is the earpiece okay ?"
        onChange={(selection) =>
          setVariant({
            ...variant,
            earpieceOk: selection == "yes" ? true : false,
          })
        }
        value={variant?.earpieceOk ? "yes" : "no"}
        withAsterisk
      >
        <Group mt="xs">
          <Radio value="yes" className="border p-4 rounded-md" label="Yes" />
          <Radio value="no" className="border p-4 rounded-md" label="No" />
        </Group>
      </Radio.Group>

      <Radio.Group
        required
        label="Is the mouthpiece okay ?"
        onChange={(selection) =>
          setVariant({
            ...variant,
            mouthpieceOk: selection == "yes" ? true : false,
          })
        }
        value={variant?.mouthpieceOk ? "yes" : "no"}
        withAsterisk
      >
        <Group mt="xs">
          <Radio value="yes" className="border p-4 rounded-md" label="Yes" />
          <Radio value="no" className="border p-4 rounded-md" label="No" />
        </Group>
      </Radio.Group>

      <Radio.Group
        required
        label="Is the speaker okay ?"
        onChange={(selection) =>
          setVariant({
            ...variant,
            speakerOk: selection == "yes" ? true : false,
          })
        }
        value={variant?.speakerOk ? "yes" : "no"}
        withAsterisk
      >
        <Group mt="xs">
          <Radio value="yes" className="border p-4 rounded-md" label="Yes" />
          <Radio value="no" className="border p-4 rounded-md" label="No" />
        </Group>
      </Radio.Group>

      <Radio.Group
        required
        label="Is the face ID or touch ID okay?"
        onChange={(selection) =>
          setVariant({
            ...variant,
            authorizationOk: selection == "yes" ? true : false,
          })
        }
        value={variant?.authorizationOk ? "yes" : "no"}
        withAsterisk
      >
        <Group mt="xs">
          <Radio value="yes" className="border p-4 rounded-md" label="Yes" />
          <Radio value="no" className="border p-4 rounded-md" label="No" />
        </Group>
      </Radio.Group>

      <Radio.Group
        required
        label="Is the SIM tray present ?"
        onChange={(selection) =>
          setVariant({
            ...variant,
            simTrayPresent: selection == "yes" ? true : false,
          })
        }
        value={variant?.simTrayPresent ? "yes" : "no"}
        withAsterisk
      >
        <Group mt="xs">
          <Radio value="yes" className="border p-4 rounded-md" label="Yes" />
          <Radio value="no" className="border p-4 rounded-md" label="No" />
        </Group>
      </Radio.Group>

      <Radio.Group
        required
        label="Does the device charge?"
        onChange={(selection) =>
          setVariant({
            ...variant,
            chargingOk: selection == "yes" ? true : false,
          })
        }
        value={variant?.chargingOk ? "yes" : "no"}
        withAsterisk
      >
        <Group mt="xs">
          <Radio value="yes" className="border p-4 rounded-md" label="Yes" />
          <Radio value="no" className="border p-4 rounded-md" label="No" />
        </Group>
      </Radio.Group>

      <br />
      <Info
        title="Honesty is the best policy"
        description="Your device will be checked once we receive it. If the information you've provided is inaccurate, we will propose a new offer"
      />
      <br />
      <Button
        size="md"
        fullWidth
        type="submit"
        loading={loadingOffer}
        disabled={loadingOffer}
      >
        See the offer
      </Button>
    </form>
  )
}

function NewTradeIn() {
  const { user, refreshApp } = useUser()
  const { session } = useSupabaseSession()
  const [activeTab, setActiveTab] = useState("device")
  const router = useRouter()

  const [loadingAccept, setLoadingAccept] = useState(false)

  const [{ data: variantsData }] = useQuery({
    query: GET_VARIANTS,
  })

  const [variant, setVariant] = useState({
    model: null,
    storage: null,
    batteryHealth: null,
    frontCamOk: false,
    backCamOk: false,
    earpieceOk: false,
    mouthpieceOk: false,
    speakerOk: false,
    authorizationOk: false,
    simTrayPresent: false,
    chargingOk: false,
    screenCondition: null,
    sideNBackCondition: null,
    offer: null,
  })

  const [_, _addBuyBack] = useMutation(ADD_BUYBACK)

  const handleSeeOffer = (_variant, buyBackPrice) => {
    let offer = Math.round(buyBackPrice)

    if (buyBackPrice < 1) {
      notifications.show({
        title: "Beyond economic repair",
        message:
          "Sadly your device does not qualify for a trade in given it's current state",
        color: "orange",
        icon: <IconInfoCircleFilled />,
      })
      return
    }

    setVariant(() => ({ ..._variant, offer }))
    setActiveTab("offer")
  }

  const omit = (obj, ...props) => {
    const result = { ...obj }
    props.forEach(function (prop) {
      delete result[prop]
    })
    return result
  }

  const handleAcceptOffer = () => {
    setLoadingAccept(true)

    if (!session?.user) {
      localStorage.setItem("tradeIn", JSON.stringify(variant))
      supabaseBrowser.auth.signInWithOAuth({ provider: 'google' })
    } else {
      _addBuyBack({
        ...omit(variant, ["batteryHealth"]),
        batteryHealth: parseInt(variant?.batteryHealth),
        email: session?.user?.email,
      })
        .then(({ data }, error) => {
          if (data?.createBuyBack && !error) {
            refreshApp()
            notifications.show({
              title: "We have received your request",
              message: `You can view the trade-in details and status updates in your account page. `,
              icon: <IconCheck />,
              color: "green",
            })

            setTimeout(() => {
              setLoadingAccept(false)
              router.push("/account?tradeIn=true")
            }, 1000)
          } else {
            notifications.show({
              message: `Oops! Something happened while sending your request`,
              icon: <IconInfoCircleFilled />,
              color: "red",
            })
            setLoadingAccept(false)
          }
        })
        .catch((err) => {
          return
        })
    }
  }

  // Phone verification
  const [otpModalOpen, setOpenOTPModal] = useState(false)
  const [otp, setOTP] = useState("")
  const [loadingVerification, setLoadingVerification] = useState(false)

  const [____, _sendVerificationToken] = useMutation(SEND_VERIFICATION_TOKEN)
  const [_____, _completeVerification] = useMutation(COMPLETE_VERIFICATION)

  const handleStartVerification = () => {
    _sendVerificationToken({
      sendVerificationTokenId: user?.id,
    }).then(({ data, error }) => {
      if (!error) {
        setOpenOTPModal(true)
        return
      }
      notifications.show({
        title: "Something occured",
        color: "orange",
      })
      return
    })
  }

  const handleCompleteVerification = () => {
    setLoadingVerification(false)

    _completeVerification({
      completeVerificationId: user?.id,
      otp,
    })
      .then(({ data, error }) => {
        if (!error && data?.completeVerification) {
          notifications.show({
            title: "Phone number verified successfully",
            color: "green",
            icon: <IconCheck />,
          })

          refreshApp()
          setOTP("")
          setOpenOTPModal(false)
          return
        }

        notifications.show({
          title: "Something occured",
          color: "orange",
          icon: <IconExclamationMark />,
        })
      })
      .catch((err) => {
        notifications.show({
          title: "Something occured",
          color: "orange",
          icon: <IconExclamationMark />,
        })
      })
      .finally(() => {
        setLoadingVerification(false)
      })
  }

  return (
    <div>
      <div className="px-4">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.Panel value="device">
            <div className="flex justify-center">
              <p className="text-[1.2rem]">1/4 Your device</p>
            </div>
            <br />
            <Info
              title="My phone does not appear on the list"
              description="If your phone brand or model does not appear on the list ,it’s not available for  trade-in at this time."
            />
            <br />

            <Questionnaire
              goToOffer={handleSeeOffer}
              variantsData={variantsData}
            />
          </Tabs.Panel>

          <Tabs.Panel value="offer">
            <div className="relative">
              <UnstyledButton
                className="absolute left-0 mt-1"
                onClick={() => setActiveTab("device")}
              >
                <IconArrowLeft />
              </UnstyledButton>
              <div className="flex justify-center">
                <p className="text-[1.2rem]">2/4 The offer</p>
              </div>
              <br />
              <br />
              <div>
                <h1 className="font-semibold text-[1.3rem]"> 🎉 Good news!</h1>
                <br />
                <p>
                  We&apos;ve found the best price we can offer is:{" "}
                  <strong>
                    {" "}
                     Ksh. {variant?.offer?.toLocaleString("en-US")} 
                  </strong>
                  for your 
                  <strong>
                    {variant?.brand} -
                    {
                      variantsData?.getVariants?.filter(
                        (_variant) => _variant?.id == variant?.model
                      )[0]?.model
                    }{" "}
                    -{" "}
                    {
                      variantsData?.getVariants
                        ?.find(({ id }) => id == variant?.model)
                        ?.storages?.find(({ id }) => id == variant?.storage)
                        ?.label
                    }
                  </strong>
                </p>
                <br />
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p>Brand</p>
                      <p className="text-gray-600">{variant?.brand}</p>
                    </div>
                    <Divider />
                    <div className="flex justify-between">
                      <p>Model</p>
                      <p className="text-gray-600">
                        {
                          variantsData?.getVariants?.filter(
                            (_variant) => _variant?.id == variant?.model
                          )[0]?.model
                        }
                      </p>
                    </div>
                    <Divider />
                    <div className="flex justify-between">
                      <p>Storage</p>
                      <p className="text-gray-600">
                        {
                          variantsData?.getVariants
                            ?.find(({ id }) => id == variant?.model)
                            ?.storages?.find(({ id }) => id == variant?.storage)
                            ?.label
                        }
                      </p>
                    </div>
                    <Divider />
                    <div className="flex justify-between">
                      <p>Screen</p>
                      <p className="text-gray-600 uppercase">
                        {variant?.screenCondition}
                      </p>
                    </div>

                    <Divider />

                    {variant?.brand == "Apple" ? (
                      <div className="flex justify-between">
                        <p>Battery health</p>
                        <p className="text-gray-600 uppercase">
                          {variant?.batteryHealth}%
                        </p>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <p>Battery status</p>
                        <p className="text-gray-600 uppercase">
                          {variant?.batteryHealth == 49 ? "WEAK" : "NORMAL"}
                        </p>
                      </div>
                    )}
                    <Divider />
                    <div className="flex justify-between">
                      <p>Sides & back</p>
                      <p className="text-gray-600 uppercase">
                        {variant?.sideNBackCondition}
                      </p>
                    </div>
                    <Divider />
                    <div className="flex justify-between">
                      <p>Front camera okay</p>
                      <p className="text-gray-600">
                        {variant?.frontCamOk ? "Yes" : "No"}
                      </p>
                    </div>
                    <Divider />
                    <div className="flex justify-between">
                      <p>Back camera okay</p>
                      <p className="text-gray-600">
                        {variant?.backCamOk ? "Yes" : "No"}
                      </p>
                    </div>
                    <Divider />
                    <div className="flex justify-between">
                      <p>Earpiece okay</p>
                      <p className="text-gray-600">
                        {variant?.earpieceOk ? "Yes" : "No"}
                      </p>
                    </div>
                    <Divider />
                    <div className="flex justify-between">
                      <p>Mouthpiece okay</p>
                      <p className="text-gray-600">
                        {variant?.mouthpieceOk ? "Yes" : "No"}
                      </p>
                    </div>

                    <Divider />
                    <div className="flex justify-between">
                      <p>Speakers okay</p>
                      <p className="text-gray-600">
                        {variant?.speakerOk ? "Yes" : "No"}
                      </p>
                    </div>

                    <Divider />
                    <div className="flex justify-between">
                      <p>Face ID/ Touch ID okay</p>
                      <p className="text-gray-600">
                        {variant?.authorizationOk ? "Yes" : "No"}
                      </p>
                    </div>

                    <Divider />
                    <div className="flex justify-between">
                      <p>Sim tray present</p>
                      <p className="text-gray-600">
                        {variant?.simTrayPresent ? "Yes" : "No"}
                      </p>
                    </div>

                    <Divider />
                    <div className="flex justify-between">
                      <p>Charging okay</p>
                      <p className="text-gray-600">
                        {variant?.chargingOk ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </Card>
                <br />
                <br />
                <div>
                  <p className="font-semibold">Next steps</p>
                  <br />
                  <div className="space-y-2">
                    <div className="flex space-x-4">
                      <IconCircleCheck />
                      <p>
                        Bring us your device to{" "}
                        <strong>Kimathi House , 4th floor , Suite 409</strong>
                      </p>
                    </div>
                    <div className="flex space-x-4">
                      <IconCircleCheck />
                      <p>
                        Receive your{" "}
                        <strong>
                           Ksh. {variant?.offer?.toLocaleString("en-US")} 
                        </strong>{" "}
                        payment
                      </p>
                    </div>
                  </div>
                </div>
                <br />
                {!user?.phoneVerified && user?.phoneNumber ? (
                  <Alert
                    p={4}
                    variant="light"
                    color="orange"
                    title="Phone number not verified"
                    icon={<IconInfoCircle />}
                  >
                    <p>We need to verify your phone number.</p>
                    <br />
                    <Button
                      onClick={handleStartVerification}
                      variant="outline"
                      fullWidth
                      size="sm"
                    >
                      Verify now
                    </Button>
                  </Alert>
                ) : !user?.phoneNumber ? (
                  <Alert
                    p={4}
                    variant="light"
                    color="orange"
                    title="Missing phone number"
                    icon={<IconInfoCircle />}
                  >
                    <p>We need your phone number for further communication.</p>
                    <br />
                    <Button
                      onClick={() => router.push("/account")}
                      variant="outline"
                      fullWidth
                      size="sm"
                    >
                      Go to profile
                    </Button>
                  </Alert>
                ) : null}
                <br />
                <Button.Group>
                  <Button variant="default" fullWidth onClick={router.back}>
                    No thanks
                  </Button>
                  <Button
                    onClick={handleAcceptOffer}
                    variant="filled"
                    loading={loadingAccept}
                    disabled={
                      loadingAccept ||
                      !user?.phoneNumber ||
                      (user?.phoneNumber && !user?.phoneVerified)
                    }
                    fullWidth
                  >
                    Accept
                  </Button>
                </Button.Group>
              </div>
            </div>
            <br />
          </Tabs.Panel>
        </Tabs>
      </div>
    </div>
  )
}

export default NewTradeIn
