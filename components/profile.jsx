import {
  Button,
  Card,
  Divider,
  Drawer,
  Modal,
  PinInput,
  Select,
  TextInput,
  UnstyledButton,
} from "@mantine/core"
import { supabaseBrowser } from "@/lib/supabaseBrowser"
import Image from "next/image"
import React, { useEffect, useState } from "react"
import SignUp from "./signup"
import { useMutation } from "urql"
import {
  COMPLETE_VERIFICATION,
  EDIT_SHIPPING,
  SEND_VERIFICATION_TOKEN,
  UPDATE_PROFILE,
} from "@/lib/request"
import { useUser } from "@/context/User"
import { notifications } from "@mantine/notifications"
import {
  IconCheck,
  IconCircleCheckFilled,
  IconExclamationMark,
  IconInfoCircle,
  IconInfoCircleFilled,
  IconPlus,
} from "@tabler/icons-react"
import { useViewportSize } from "@mantine/hooks"

function Profile({ user }) {
  const { width } = useViewportSize()
  const { refreshApp } = useUser()
  
  console.log('Profile component - user object:', user)
  console.log('Profile component - user phone number:', user?.phoneNumber)
  const [error, setError] = useState(null)
  const [account, setAccount] = useState({
    name: user?.name,
    phoneNumber: user?.phoneNumber,
  })

  const validatePhone = (value) => {
    const regex = /^\+254\d{9}$/ // Matches +254XXXXXXXXX (Only numbers after +254)
    if (!regex.test(value)) {
      setError("Enter a valid phone number in the format +254XXXXXXXXX")
    } else {
      setError(null)
    }
  }

  const [loadingEdit, setLoadingEdit] = useState(false)
  const [editPersonal, setEditPersonal] = useState(false)
  const [editShipping, setEditShipping] = useState(false)

  const [shipping, setShipping] = useState({
    building: null,
    suite: null,
    street: null,
    town: null,
  })

  const [__, _editShipping] = useMutation(EDIT_SHIPPING)

  const handleSaveUpdates = async () => {
    setLoadingEdit(true)

    try {
      // Update profile directly in Supabase
      const updateData = {}
      
      if (account?.phoneNumber) updateData.phoneNumber = account.phoneNumber
      if (account?.name) updateData.name = account.name

      const { data, error } = await supabaseBrowser
        .from('users')
        .update(updateData)
        .eq('id', user?.id)
        .select()

      if (error) {
        console.error('Error updating profile:', error)
        notifications.show({
          title: "An error occurred",
          message: error.message,
          icon: <IconInfoCircleFilled />,
          color: "red",
        })
      } else {
        console.log('Profile updated successfully:', data)
        console.log('Updated phone number:', data[0]?.phoneNumber)
        console.log('Current user phone number:', user?.phoneNumber)
        
        // Wait a moment for the database to update, then refresh
        setTimeout(() => {
          console.log('Calling refreshApp...')
          refreshApp()
        }, 500)
        
        notifications.show({
          title: "Profile details saved",
          icon: <IconCheck />,
          color: "green",
        })
        setAccount({
          firstName: null,
          lastName: null,
          phoneNumber: null,
        })
        setEditPersonal(false)
      }
    } catch (err) {
      console.error('Error:', err)
      notifications.show({
        title: "An error occurred",
        message: err.message,
        icon: <IconInfoCircleFilled />,
        color: "red",
      })
    } finally {
      setLoadingEdit(false)
    }
  }

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

  // Phone verification
  const [otpModalOpen, setOpenOTPModal] = useState(false)
  const [otp, setOTP] = useState("")
  const [loadingVerification, setLoadingVerification] = useState(false)

  const [___, _sendVerificationToken] = useMutation(SEND_VERIFICATION_TOKEN)
  const [____, _completeVerification] = useMutation(COMPLETE_VERIFICATION)

  const handleStartVerification = () => {
    _sendVerificationToken({
      sendVerificationTokenId: user?.id,
    }).then(({ data, error }) => {
      console.log('Verification token response:', { data, error })
      if (!error && data?.sendVerificationToken === "OK") {
        setOpenOTPModal(true)
        notifications.show({
          title: "Verification code sent",
          message: "Check your phone for the SMS",
          color: "green",
        })
        return
      }
      notifications.show({
        title: "Failed to send verification",
        message: "Please try again",
        color: "red",
      })
      return
    })
  }

  const handleCompleteVerification = () => {
    setLoadingVerification(true)

    _completeVerification({
      completeVerificationId: user?.id,
      otp,
    })
      .then(({ data, error }) => {
        console.log('Complete verification response:', { data, error })
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
          title: "Verification failed",
          message: "Invalid OTP code",
          color: "red",
          icon: <IconExclamationMark />,
        })
      })
      .catch((err) => {
        console.error('Verification error:', err)
        notifications.show({
          title: "Verification failed",
          message: "Please try again",
          color: "red",
          icon: <IconExclamationMark />,
        })
      })
      .finally(() => {
        setLoadingVerification(false)
      })
  }

  // Fetching shipping data
  const [towns, setTowns] = useState([])

  useEffect(() => {
    fetch("/data.json")
      .then((res) => res.json())
      .then((json) => setTowns(json))
  }, [])

  if (!user) return <SignUp />

  return (
    <div>
      <div className="py-8 space-y-8 lg:p-2 lg:space-y-0 lg:grid lg:gap-4 lg:grid-cols-2">
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          className="col-span-1"
        >
          <div className="flex justify-between">
            <h1 className="text-[1.2rem] font-semibold ">Personal details</h1>
            <Button
              variant="default"
              color="black"
              size="sm"
              onClick={() => setEditPersonal(true)}
            >
              Edit
            </Button>
          </div>

          <br />
          <div className="grid grid-cols-4 space-x-8">
            <Image
              height={80}
              width={80}
              src={user?.image}
              className="w-[100px] object-cover rounded-full col-span-1"
            />
            <div className="col-span-3">
              <p className="text-[0.9rem] font-semibold ">{user?.name}</p>
              <p className="text-[0.9rem]">{user?.email}</p>

              <p className="text-[0.9rem]">
                {user?.phoneVerified && (
                  <IconCircleCheckFilled
                    className="inline mr-1"
                    color="green"
                    size={20}
                  />
                )}
                {user?.phoneNumber}
              </p>

              {!user?.phoneVerified && user?.phoneNumber && (
                <p
                  className="text-red-600 mt-2 hover:cursor-pointer"
                  onClick={handleStartVerification}
                >
                  Verify phonenumber
                </p>
              )}

              {!user?.phoneNumber && (
                <p
                  className="text-red-600 mt-2 hover:cursor-pointer"
                  onClick={() => setEditPersonal(true)}
                >
                  Add phone number
                </p>
              )}

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
              <br />

              <p
                className="underline text-[0.8rem] hover:cursor-pointer text-red-500"
                onClick={() => supabaseBrowser.auth.signOut()}
              >
                Sign out
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="col-span-1"
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
        >
          <div className="flex justify-between">
            <h1 className="text-[1.2rem] font-semibold ">Shipping details</h1>
            <Button
              variant="default"
              color="black"
              size="sm"
              onClick={() => setEditShipping(true)}
            >
              Edit
            </Button>
          </div>

          <br />

          <div>
            <p className="text-[0.9rem] font-semibold ">
              {user?.shipping?.building} , {user?.shipping?.suite}
            </p>
            <p className="text-[0.9rem]">{user?.shipping?.street}</p>
            <p className="text-[0.9rem]">{user?.shipping?.town}</p>
            <br />
          </div>
        </Card>

        <Drawer
          opened={editPersonal}
          position={width > 750 ? "right" : "bottom"}
          size={width > 750 ? "30%" : "60%"}
          onClose={() => setEditPersonal(false)}
          title={
            <h1 className="text-[1.3rem] font-semibold">Personal details</h1>
          }
        >
          <div className="px-4">
            <Divider />
            <br />

            <TextInput
              defaultValue={user?.name}
              label="Full name"
              value={account?.name}
              onChange={(e) =>
                setAccount((_account) => ({
                  ..._account,
                  name: e.target.value,
                }))
              }
              className="col-span-1"
              withAsterisk
            />

            <br />

            <TextInput
              withAsterisk
              disabled
              label="Email"
              defaultValue={user?.email}
            />
            <br />
            <TextInput
              label="Phone number"
              placeholder="+254XXXXXXXXX"
              defaultValue={user?.phoneNumber}
              value={account?.phoneNumber}
              onChange={(e) => {
                setAccount((_account) => ({
                  ..._account,
                  phoneNumber: e.target.value,
                }))
                validatePhone(e.target.value)
              }}
              error={error}
            />
            <br />
            <br />

            <Button
              loading={loadingEdit}
              disabled={loadingEdit || error}
              onClick={handleSaveUpdates}
              variant="filled"
              fullWidth
            >
              Save
            </Button>
            <br />
          </div>
        </Drawer>

        <Drawer
          opened={editShipping}
          position={width > 750 ? "left" : "bottom"}
          size={width > 750 ? "30%" : "60%"}
          onClose={() => setEditShipping(false)}
          title={
            <h1 className="text-[1.3rem] font-semibold">Shipping details</h1>
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
            {/* <TextInput
              withAsterisk
              label="City/Town"
              defaultValue={user?.shipping?.town}
              value={shipping?.town}
              onChange={(e) =>
                setShipping((_shipping) => ({
                  ..._shipping,
                  town: e.target.value,
                }))
              }
            /> */}

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

            <Button onClick={handleEditShipping} variant="filled" fullWidth>
              Save
            </Button>
            <br />
          </div>
        </Drawer>
      </div>
    </div>
  )
}

export default Profile
