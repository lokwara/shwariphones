import { Footer, Header, ProductCard } from "@/components"
import AcceptedPayments from "@/components/acceptedpayments"
import Loader from "@/components/loader"
import { useUser } from "@/context/User"
import {
  COMPLETE_VERIFICATION,
  CREATE_FINANCING_REQUEST,
  EDIT_SHIPPING,
  REMOVE_FROM_CART,
  SEND_VERIFICATION_TOKEN,
} from "@/lib/request"
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Drawer,
  Modal,
  PinInput,
  Radio,
  Select,
  TextInput,
  Timeline,
} from "@mantine/core"
import { useViewportSize } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import {
  IconCheck,
  IconExclamationMark,
  IconInfoCircle,
  IconInfoCircleFilled,
  IconLock,
  IconX,
} from "@tabler/icons-react"
import axios from "axios"

import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"

import { useMutation } from "urql"

const Map = dynamic(() => import("../components/map"), {
  loading: () => <p>A map is loading</p>,
  ssr: false,
})

function Cart() {
  const { width } = useViewportSize()
  const { user, refreshApp } = useUser()
  const router = useRouter()

  const [isSticky, setIsSticky] = useState(false)
  const [checkoutOpen, setCheckout] = useState(false)
  const [editShipping, setEditShipping] = useState(false)
  const [shipping, setShipping] = useState({
    building: null,
    suite: null,
    street: null,
    town: null,
  })

  const [_, _editShipping] = useMutation(EDIT_SHIPPING)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const triggerPoint = 300

      if (scrollY >= triggerPoint) {
        setIsSticky(true)
      } else {
        setIsSticky(false)
      }
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Fetching shipping data
  const [towns, setTowns] = useState([])

  useEffect(() => {
    fetch("/data.json")
      .then((res) => res.json())
      .then((json) => setTowns(json))
  }, [])

  const handleEditShipping = () => {
    if (!shipping.town) {
      notifications.show({
        title: "Please select a town",
        color: "orange",
        message: "It helps us calculate your shipping cost",
      })
      return
    }

    _editShipping({
      editShippingId: user?.id,
      ...shipping,
    }).then(({ data }, error) => {
      if (data?.editShipping && !error) {
        notifications.show({
          title: "Shipping information saved",
          icon: <IconCheck />,
          color: "green",
        })
        refreshApp()
        setEditShipping(false)
      } else {
        notifications.show({
          title: "An error occured",
          icon: <IconInfoCircleFilled />,
          color: "red",
        })
      }
    })
  }

  const getTotalCartPrice = () => {
    let productCost = user?.cart.reduce((total, item) => {
      if (item?.onOffer) {
        return total + item?.device?.offer?.price
      }

      const selectedStorage = item.variant?.storages?.find(
        (s) => s.id === item.storage
      )

      return total + (selectedStorage?.price ?? 0)
    }, 0)

    let shippingCost =
      towns?.find((town) => town?.value == user?.shipping?.town)?.price ?? 0

    return productCost + shippingCost
  }

  const cartTotal = getTotalCartPrice()

  // Checking out
  const [financingOption, setFinancingOption] = useState("none")
  const [position, setPosition] = useState()
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentLink, setPaymentLink] = useState(null)
  const [stkNumber, setStkNumber] = useState("")
  const [payLoading, setPayLoading] = useState(false)
  const [stkNumberError, setStkNumberError] = useState(null)

  const [___, _createFinancingRequest] = useMutation(CREATE_FINANCING_REQUEST)

  const validatePhone = (phone) => {
    const phoneRegex = /^0\d{9}$/ // Ensures 10 digits, starting with 0

    if (!phoneRegex.test(phone)) {
      setStkNumberError("Phone number must be 10 digits and start with 0")
    } else {
      setStkNumberError("") // Clear error
    }
  }

  const checkoutWithFinancing = () => {
    setLoadingCheckout(!loadingCheckout)

    const payload = {
      cart: JSON.stringify(
        user?.cart?.map(({ color, storage, variant: { id } }) => ({
          color,
          storage,
          variant: id,
        }))
      ),
      customer: user?.id,
      financer: financingOption,
    }

    setTimeout(() => {
      _createFinancingRequest(payload)
        .then(({ data, error }) => {
          if (data && !error) {
            notifications.show({
              title: "Your financing request has been sent",
              icon: <IconCheck />,
              message: "An agent will contact you shortly",
              color: "green",
            })
            setFinancingOption("buySimu")
            setPosition()
            setCheckout(false)
            refreshApp()
            router.push("/account?financing=true")
          } else {
            notifications.show({
              message: `Oops! Something happened while sending your request`,
              icon: <IconInfoCircleFilled />,
              color: "red",
            })
          }
        })
        .catch((err) => {
          notifications.show({
            message: `Oops! Something happened while sending your request`,
            icon: <IconInfoCircleFilled />,
            color: "red",
          })
        })
        .finally(() => {
          setLoadingCheckout(false)
        })
    }, 500)
  }

  const handleInitiateTx = async () => {
    setPayLoading(true)

    if (!paymentLink) {
      try {
        let amount =
          cartTotal -
          (towns?.find((town) => town?.value == user?.shipping?.town)?.price ??
            0)

        const res = await axios.post(
          "/api/pesapal_create_request",
          {
            amount,
            description: `${user?.name} (${user?.email}) order`,
            phone: stkNumber,
            email: user?.email,
            name: user?.name,
            town: user?.shipping?.town,
            user: user?.id,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )

        console.log(res.status)

        if (res.status == 201) {
          notifications.show({
            message: "Device sold already",
            title: "Sold",
            color: "orange",
          })

          return
        } else if (res.status == 200) {
          setPaymentLink(res?.data?.redirect_url)

          setPaymentModalOpen(true)
        }
      } catch (err) {
        return
      } finally {
        setPayLoading(false)
      }
    } else {
      setPaymentModalOpen(true)
    }
  }

  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false)
    setPaymentLink(null)
    setPayLoading(false)
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
    <div className="bg-slate-100 w-full min-h-screen ">
      <Header />

      <div className="lg:flex">
        <div className="lg:w-3/5 ">
          {user?.cart?.length < 1 ? (
            <div className="p-8 space-y-2 lg:space-x-8 lg:px-48 lg:pt-24 lg:flex">
              {width > 750 && (
                <img
                  src="/emptyBasket.svg"
                  alt="empty_basket"
                  className="w-3/5 mx-auto lg:w-[200px]"
                />
              )}

              <div className="space-y-2">
                <h1 className="font-duplet font-bold text-[1.4rem]">
                  There&apos;s nothing in your cart
                </h1>
                <p>All this stellar refurb isn&apos;t gonna shop itself!</p>

                {width < 750 && (
                  <img
                    src="/emptyBasket.svg"
                    alt="empty_basket"
                    className="w-3/5 mx-auto lg:w-[200px] pt-[50px]"
                  />
                )}
                <br />
                <br />
                <Button fullWidth size="lg" onClick={() => router.push("/all")}>
                  Let&apos;s get shopping
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 space-y-12">
              <h1 className="text-[1.3rem] font-semibold">Your cart</h1>
              <div className="space-y-6">
                {user?.cart?.map((cartItem) => (
                  <CartItem
                    key={cartItem?.id}
                    cartItem={cartItem}
                    email={user?.email}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Small device , cart not empty */}
          {user?.cart?.length > 0 && width < 750 ? (
            <div>
              <CartSummary
                shipping={user?.shipping}
                cart={user?.cart}
                clickCheckout={() => setCheckout(true)}
                cartTotal={cartTotal}
              />

              <AcceptedPayments />

              <Footer />

              {/* Sticky footer with checkout */}

              {user?.cart?.filter((device) => !device?.saleInfo?.saleVia)
                .length > 0 && (
                <div
                  className={`fixed z-[20] left-0 right-0 p-4 bg-white border border-t-[1px]  transition-transform duration-300 ${
                    isSticky ? "bottom-0" : "-bottom-full"
                  }`}
                >
                  <div className="flex justify-between">
                    <div className="mt-1">
                      <p className=" text-[0.8rem]">Cart total</p>
                      <h1 className="font-semibold ">
                        Ksh.{" "}
                        {(
                          cartTotal -
                          (towns?.find(
                            (town) => town?.value == user?.shipping?.town
                          )?.price ?? 0)
                        ).toLocaleString("en-US")}
                      </h1>
                    </div>

                    <Button
                      loading={payLoading}
                      disabled={payLoading}
                      size="lg"
                      onClick={() => setCheckout(true)}
                    >
                      <p className="text-[0.8rem] font-normal">Checkout</p>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Large device */}
        <div className="lg:w-2/5 ">
          {width > 750 &&
            user?.cart?.length > 0 &&
            user?.cart?.filter((device) => !device?.saleInfo?.saleVia).length >
              0 && (
              <CartSummary
                shipping={user?.shipping}
                cart={user?.cart}
                clickCheckout={() => setCheckout(true)}
                cartTotal={cartTotal}
              />
            )}
        </div>

        <Drawer
          opened={checkoutOpen}
          onClose={() => setCheckout(false)}
          size={width < 750 ? "90%" : "50%"}
          position={width < 750 ? "bottom" : "left"}
        >
          <div className="space-y-6 pt-0 p-8">
            <h1 className="text-[1.2rem] font-semibold ">Almost there!</h1>
            {!user?.phoneVerified && user?.phoneNumber ? (
              <Alert
                p={4}
                variant="light"
                color="orange"
                title="Phone number not verified yet"
                icon={<IconInfoCircle />}
              >
                <p>
                  We need to verify your phone number for further communication
                  and alerts about your order status.
                </p>
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
                <p>
                  We need your phone number for further communication and alerts
                  about your order status.
                </p>
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

            <Modal
              centered
              title={<strong>Verify phone number</strong>}
              opened={otpModalOpen}
              onClose={() => setOpenOTPModal(false)}
            >
              <div className="p-4 space-y-3">
                <p>
                  We sent an OTP to the number you just supplied. Kindly enter
                  it below to get your phone number verified
                </p>

                <div className="flex justify-center">
                  <PinInput oneTimeCode value={otp} onChange={setOTP} />
                </div>

                {otp.length == 4 && (
                  <Button
                    loading={loadingVerification}
                    disabled={loadingVerification}
                    fullWidth
                    onClick={handleCompleteVerification}
                  >
                    Verify{" "}
                  </Button>
                )}
              </div>
            </Modal>

            <div className="space-y-6">
              <Timeline active={1} bulletSize={24} lineWidth={2}>
                <Timeline.Item title="Financing">
                  <br />
                  <Radio.Group
                    description="Choose the way you want to make your purchase"
                    value={financingOption}
                    onChange={setFinancingOption}
                  >
                    <div className="space-y-2 pt-3">
                      {user?.cart?.some((item) =>
                        item?.variant?.financing?.includes("buySimu")
                      ) &&
                        !user?.cart?.some((item) => item?.onOffer) && (
                          <Radio value="buySimu" label="Buy Simu" />
                        )}

                      {user?.cart?.some((item) =>
                        item?.variant?.financing?.includes("chanteq")
                      ) &&
                        !user?.cart?.some((item) => item?.onOffer) && (
                          <Radio value="chanteq" label="Chanteq" />
                        )}

                      <Radio value="none" label="No financing" />
                    </div>
                  </Radio.Group>

                  {(financingOption === "chanteq" ||
                    financingOption === "buySimu") && (
                    <div>
                      <Alert
                        className="mt-4"
                        p={4}
                        variant="light"
                        color="blue"
                        title="Next step"
                        icon={<IconInfoCircle />}
                      >
                        One of our staff will call you and guide you on how to
                        send the required documents.
                      </Alert>

                      <br />

                      {user?.phoneVerified && (
                        <Button
                          fullWidth
                          size="lg"
                          onClick={checkoutWithFinancing}
                          loading={loadingCheckout}
                          disabled={loadingCheckout}
                        >
                          Proceed
                        </Button>
                      )}
                    </div>
                  )}
                </Timeline.Item>

                {financingOption === "none" && (
                  <Timeline.Item title="Shipping">
                    <br />
                    <div className="space-y-6">
                      {/* <p>Pin your location (optional)</p>
                      <Map
                        center={[-1.286389, 36.817223]}
                        zoom={12}
                        getPosition={setPosition}
                      /> */}

                      <p>Confirm your shipping address</p>
                      <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <div className="flex justify-between">
                          <h1 className="text-[1.2rem] font-semibold ">
                            Shipping details
                          </h1>
                          <Button
                            variant="default"
                            size="xs"
                            onClick={() => setEditShipping(true)}
                          >
                            Edit
                          </Button>
                        </div>

                        <br />

                        {!user?.shipping?.building &&
                        !user?.shipping?.suite &&
                        !user?.shipping?.town &&
                        !user?.shipping?.street ? (
                          <p className="text-orange-600">
                            No shipping details saved
                          </p>
                        ) : (
                          <div>
                            <p className="text-[0.9rem] font-semibold ">
                              {user?.shipping?.building} ,{" "}
                              {user?.shipping?.suite}
                            </p>
                            <p className="text-[0.9rem]">
                              {user?.shipping?.street}{" "}
                            </p>
                            <p className="text-[0.9rem]">
                              {user?.shipping?.town}
                            </p>
                            <br />
                          </div>
                        )}

                        {!user?.shipping?.town && (
                          <p className="text-orange-600">
                            *City/Town is a required field
                          </p>
                        )}
                      </Card>
                    </div>
                    <Drawer
                      size={width < 750 ? "60%" : "30%"}
                      position={width < 750 ? "bottom" : "left"}
                      opened={editShipping}
                      onClose={() => setEditShipping(false)}
                      title={
                        <h1 className="text-[1.3rem] font-semibold">
                          Shipping details
                        </h1>
                      }
                    >
                      <div className="px-4">
                        <Divider />
                        <br />

                        <div className="grid grid-cols-2 gap-4">
                          <TextInput
                            label="Building name"
                            className="col-span-1"
                            defaultValue={user?.shipping?.building}
                            value={shipping?.building}
                            onChange={(e) =>
                              setShipping((_shipping) => ({
                                ..._shipping,
                                building: e.target.value,
                              }))
                            }
                          />
                          <TextInput
                            label="Suite"
                            className="col-span-1"
                            defaultValue={user?.shipping?.suite}
                            value={shipping?.suite}
                            onChange={(e) =>
                              setShipping((_shipping) => ({
                                ..._shipping,
                                suite: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <br />

                        <TextInput
                          label="Street name"
                          defaultValue={user?.shipping?.street}
                          value={shipping?.street}
                          onChange={(e) =>
                            setShipping((_shipping) => ({
                              ..._shipping,
                              street: e.target.value,
                            }))
                          }
                        />
                        <br />

                        <Select
                          withAsterisk
                          label="City/Town"
                          data={towns}
                          searchable
                          value={shipping?.town}
                          onChange={(val) =>
                            setShipping((_shipping) => ({
                              ..._shipping,
                              town: val,
                            }))
                          }
                        />
                        <br />
                        <br />

                        <Button
                          onClick={handleEditShipping}
                          variant="filled"
                          fullWidth
                        >
                          Save
                        </Button>
                        <br />
                      </div>
                    </Drawer>
                  </Timeline.Item>
                )}

                {financingOption === "none" && (
                  <Timeline.Item title="Payment">
                    <br />
                    <TextInput
                      required
                      label="Phone number"
                      value={stkNumber}
                      placeholder="0XXXXXXXXX"
                      onChange={(e) => {
                        setStkNumber(e.target.value)
                        validatePhone(e.target.value)
                      }}
                      error={stkNumberError}
                    />

                    <br />

                    {user?.shipping?.town &&
                      user?.phoneVerified &&
                      stkNumber &&
                      !stkNumberError && (
                        <Button
                          fullWidth
                          onClick={handleInitiateTx}
                          size="lg"
                          type="submit"
                          loading={payLoading}
                          disabled={payLoading}
                        >
                          Confirm and pay
                        </Button>
                      )}

                    <Modal
                      centered
                      opened={paymentModalOpen}
                      withCloseButton={false}
                      closeOnClickOutside={false}
                      onClose={handleClosePaymentModal}
                    >
                      <iframe
                        className="no-scrollbar border-none"
                        src={paymentLink}
                        width="100%"
                        height="500px"
                      />
                    </Modal>
                  </Timeline.Item>
                )}
              </Timeline>
            </div>
          </div>
        </Drawer>
      </div>

      {/* Large device , cart not empty */}
      {width > 750 && user?.cart?.length > 0 && (
        <>
          {/* <CompleteCart /> */}

          {/* Accepted payment methods */}
          <AcceptedPayments />

          {/* Footer */}
          <Footer />
        </>
      )}
    </div>
  )
}

const CartItem = ({ cartItem, email }) => {
  const router = useRouter()
  const [loadingRemove, setLoadingRemove] = useState(false)
  const { refreshApp } = useUser()

  const [_, _removeFromCart] = useMutation(REMOVE_FROM_CART)

  const handleRemoveFromCart = () => {
    setLoadingRemove(true)
    _removeFromCart({
      email,
      removeFromCartId: cartItem?.id,
    })
      .then(({ data }, error) => {
        if (data && !error) {
          refreshApp()
          return
        } else {
          notifications.show({
            title: `An error occured`,
            icon: <IconInfoCircleFilled />,
            color: "red",
          })
        }
      })
      .catch((err) => {
        notifications.show({
          title: `An error occured`,
          icon: <IconInfoCircleFilled />,
          color: "red",
        })
      })
      .finally(() => setLoadingRemove(false))
  }

  return (
    <div className="px-6 py-4 bg-white rounded-lg relative">
      <div className="absolute w-[24px] h-[24px] top-0 right-0 z-10">
        <Button
          onClick={handleRemoveFromCart}
          w={32}
          h={32}
          color="red"
          loading={loadingRemove}
          disabled={loadingRemove}
          p={0}
          className="absolute top-[-8px] right-0"
        >
          <IconX />
        </Button>
      </div>
      <div className="flex gap-4 items-center">
        <div>
          <img
            className="h-[80px] w-[80px] object-contain"
            src={`${
              cartItem?.variant?.colors?.find(
                (color) => color["id"] == cartItem?.color
              )?.images[
                cartItem?.variant?.colors?.find(
                  (color) => color["id"] == cartItem?.color
                )?.primaryIndex || 0
              ]
            }`}
          />
        </div>

        <div className="space-y-1 relative">
          <p
            className=" font-semibold  text-[0.8rem] hover:underline hover:cursor-pointer"
            onClick={() => router.push(`/product/${cartItem?.variant?.id}`)}
          >
            {cartItem?.variant?.model} -{" "}
            {
              cartItem?.variant?.storages?.find(
                (storage) => storage["id"] == cartItem?.storage
              )?.label
            }{" "}
            -{" "}
            {
              cartItem?.variant?.colors?.find(
                (color) => color["id"] == cartItem?.color
              )?.label
            }
          </p>

          {/* {device?.comesWith?.length > 0 && (
            <p className="text-[0.8rem] text-gray-500">
              Comes with:{" "}
              {device?.comesWith.map((item, i) => (
                <span key={i} className="uppercase">
                  {item}
                </span>
              ))}
            </p>
          )} */}

          <p className=" font-semibold text-slate-500 ">
            Ksh.{" "}
            {cartItem?.onOffer
              ? cartItem?.device?.offer?.price.toLocaleString("en-US")
              : cartItem?.variant?.storages
                  ?.find((storage) => storage["id"] == cartItem?.storage)
                  ?.price?.toLocaleString("en-US")}
          </p>

          {cartItem?.onOffer && (
            <div className="flex space-x-2">
              <Badge color="#94f5bc" radius={"xs"} p={4}>
                <p className="text-[#006b40] text-[0.5rem]">
                  Save Ksh.
                  {(
                    cartItem?.variant?.storages?.find(
                      (storage) => storage["id"] == cartItem?.storage
                    )?.price - cartItem?.device?.offer?.price
                  ).toLocaleString("en-US")}
                </p>
              </Badge>
              <p className="line-through text-[0.8rem] text-gray-500">
                Ksh.{" "}
                {cartItem?.variant?.storages
                  ?.find((storage) => storage["id"] == cartItem?.storage)
                  ?.price?.toLocaleString("en-US")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const CartSummary = ({ shipping, clickCheckout, cart, cartTotal }) => {
  const [privacyPolicyOpen, setOpenPrivacyPolicy] = useState(false)

  // Fetching shipping data
  const [towns, setTowns] = useState([])

  useEffect(() => {
    fetch("/data.json")
      .then((res) => res.json())
      .then((json) => setTowns(json))
  }, [])

  return (
    <div className="bg-slate-100 p-8 space-y-8">
      <h1 className="text-[1.3rem] font-semibold">Summary</h1>

      <div className="bg-white p-4 min-w-[220px] space-y-4 relative">
        <div className="space-y-6">
          {cart.map((cartItem) => (
            <SummaryCard key={cartItem?.id} cartItem={cartItem} />
          ))}
        </div>
        <Divider />
        <br />
        <div className="flex justify-between">
          <p>Gadget(s) price</p>
          <p>
            Ksh.
            {(
              cartTotal -
              (towns?.find((town) => town?.value == shipping?.town)?.price ?? 0)
            ).toLocaleString("en-US")}
          </p>
        </div>
        <div className="flex justify-between">
          <p>Shipping (to {shipping?.town})</p>
          {/* <p>
            Ksh.{" "}
            {towns?.find((town) => town?.value == shipping?.town)?.price ?? 0}
          </p> */}
          <p>Ksh. 0</p>
        </div>
        <div className="flex justify-between">
          <p>Total</p>
          {/* <strong>Ksh. {cartTotal?.toLocaleString("en-US")}</strong> */}
          <strong>
            Ksh.{" "}
            {(
              cartTotal -
              (towns?.find((town) => town?.value == shipping?.town)?.price ?? 0)
            ).toLocaleString("en-US")}
          </strong>
        </div>
        <br />
        <Button fullWidth onClick={clickCheckout}>
          Checkout
        </Button>
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <IconLock size={16} />
            <p className="text-[0.7rem]">Secure payment</p>
          </div>
        </div>
        <br />
        <p className="text-[0.7rem]">
          By confirming this order you accept our {" "}
          <a onClick={() => setOpenPrivacyPolicy(true)} className="underline">
            Return & refund policy
          </a>
          <Modal
            centered
            opened={privacyPolicyOpen}
            onClose={() => setOpenPrivacyPolicy(false)}
            title={
              <strong className="text-[1.3rem] p-2">
                Return & Refunds Policy
              </strong>
            }
          >
            <div className="space-y-2">
              <h2 className="font-bold">1. Return Policy</h2>
              <h3 className="italic">1.1 Eligibility for Returns</h3>
              <p>
                <strong>Goods once sold cannot be returned!</strong>
              </p>
              <br />

              <h2 className="font-bold">2. Warranty Policy</h2>

              <h3 className="italic">2.1 Warranty Coverage</h3>
              <p>
                Each preloved phone comes with a{" "}
                <strong>6-month warranty</strong> against functional defects not
                caused by user error or damage. This warranty covers only
                software issues and does not include accessories.
              </p>

              <br />
              <h3 className="italic">2.2 Exclusions from Warranty</h3>
              <p>The warranty does not cover:</p>
              <ol>
                <li className="text-[0.7rem]">
                  1. Damage caused by misuse, accidents, or unauthorized
                  repairs.
                </li>
                <li className="text-[0.7rem]">
                  2. Software issues or any damage related to third-party
                  applications.
                </li>
                <li className="text-[0.7rem]">3. Normal wear and tear.</li>
              </ol>

              <br />
              <h3 className="italic">2.3 Claiming Warranty Service</h3>
              <p>
                To claim warranty service, please contact our customer service
                at <strong>0705820082</strong> and provide:
              </p>
              <ul>
                <li className="text-[0.7rem]">1. Your phone IMEI.</li>
                <li className="text-[0.7rem]">
                  2. A description of the issue.
                </li>
                <li className="text-[0.7rem]">
                  3. Any relevant photos of the problem.
                </li>
              </ul>
              <p>We may require you to send the device to us for inspection.</p>

              <br />
              <h3 className="italic">2.4 Warranty Resolution</h3>
              <p>
                If your device is found to be defective and covered by the
                warranty, we will <strong>repair or replace</strong> the device
                at our discretion. If repairs take longer than{" "}
                <strong>72 hours</strong>, customers will be offered a
                replacement or a full refund.
              </p>
              <br />

              <h2 className="font-bold">3. General Conditions</h2>

              <h3 className="italic">3.1 Changes to Policies</h3>
              <p>
                We reserve the right to modify these terms and conditions at any
                time. Any changes will be communicated to customers through our
                website.
              </p>
            </div>
          </Modal>
           
        </p>
      </div>
    </div>
  )
}

const SummaryCard = ({ cartItem }) => {
  return (
    <div className="flex space-x-4 items-center">
      <img
        className="h-[80px] w-[80px] object-contain"
        src={`${
          cartItem?.variant?.colors?.find(
            (color) => color["id"] == cartItem?.color
          )?.images[
            cartItem?.variant?.colors?.find(
              (color) => color["id"] == cartItem?.color
            )?.primaryIndex || 0
          ]
        }`}
      />

      <div className="space-y-1">
        <p className=" font-semibold ">
          {cartItem?.variant?.model} -{" "}
          {
            cartItem?.variant?.storages?.find(
              (storage) => storage["id"] == cartItem?.storage
            )?.label
          }{" "}
          -{" "}
          {
            cartItem?.variant?.colors?.find(
              (color) => color["id"] == cartItem?.color
            )?.label
          }
        </p>

        <p className=" font-medium text-gray-500">
          Ksh.
          {cartItem?.onOffer
            ? cartItem?.device?.offer?.price?.toLocaleString("en-US")
            : cartItem?.variant?.storages
                ?.find((storage) => storage["id"] == cartItem?.storage)
                ?.price?.toLocaleString("en-US")}
        </p>
      </div>
    </div>
  )
}

export default Cart
