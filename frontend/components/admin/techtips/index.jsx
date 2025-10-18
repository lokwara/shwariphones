import { useUser } from "@/context/User"
import { ADD_TECH_TIP, GET_TECH_TIPS, REMOVE_TECH_TIP } from "@/lib/request"
import { Button, Modal, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconPlus } from "@tabler/icons-react"
import React, { useState } from "react"
import ReactPlayer from "react-player"
import { useMutation, useQuery } from "urql"

function TechTips() {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_TECH_TIPS,
  })

  const { user } = useUser()

  const [_, _addTechTip] = useMutation(ADD_TECH_TIP)

  const [newtechTip, setNewTechTip] = useState(false)

  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState("")

  const handleAddTip = () => {
    if (!link) {
      notifications.show({
        title: "No video link entered",
        color: "orange",
      })
      return
    }

    setLoading(true)

    _addTechTip({
      link,
      createdBy: user?.id,
    })
      .then(({ data }, error) => {
        if (data && !error) {
          notifications.show({
            title: "Tech tip saved successfully",
            color: "green",
          })

          setNewTechTip(false)
          setLink("")
          reexecuteQuery()

          return
        }

        notifications.show({
          title: "Error , try again later",
          color: "red",
        })

        return
      })
      .catch((err) => {
        notifications.show({
          title: "Error , try again later",
          color: "red",
        })

        return
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleCloseNewTechTip = () => {
    setLink("")
    setNewTechTip(false)
  }

  return (
    <div className="bg-slate-100 p-8 w-full h-screen relative">
      <h1 className="text-xl font-bold">TechTips</h1>
      <br />
      <div className="h-[calc(100vh-100px)] max-w-full grid grid-cols-3 items-center no-scrollbar  overflow-auto ">
        {(data?.getTechTips ?? []).map((tip) => (
          <TechTip tip={tip} key={tip?.id} />
        ))}
      </div>

      <div className="fixed bottom-8 right-8">
        <Button
          p={0}
          w={50}
          h={50}
          radius={50}
          onClick={() => setNewTechTip(true)}
        >
          <IconPlus />
        </Button>
      </div>

      <Modal
        size="80%"
        centered
        opened={newtechTip}
        onClose={handleCloseNewTechTip}
        title={<h1 className="font-bold p-4 text-[1.2rem]">New tech tip</h1>}
      >
        <div className="p-4">
          <TextInput
            value={link}
            onChange={(e) => setLink(e.target.value)}
            label="Link"
            withAsterisk
            placeholder="ex. https://www.youtube.com/watch?v=VYR2IgjrIIE"
          />

          <br />

          <Button onClick={handleAddTip}>Add tech tip</Button>
        </div>
      </Modal>
    </div>
  )
}

const TechTip = ({ tip }) => {
  const [loading, setLoading] = useState(false)

  const [_, _removeTip] = useMutation(REMOVE_TECH_TIP)

  const handleRemoveTip = () => {
    setLoading(true)

    _removeTip({
      deleteTechTipId: tip.id,
    })
      .then(({ data }, error) => {
        if (data && !error) {
          notifications.show({
            title: "Tech tip removed!",
            color: "green",
          })

          return
        }

        notifications.show({
          title: " Error occured, try later",
          color: "orange",
        })
        return
      })
      .catch((err) => {
        notifications.show({
          title: " Error occured, try later",
          color: "orange",
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div className="mb-24 col-span-1 rounded-lg h-[400px] max-w-[300px] mx-auto aspect-video">
      <ReactPlayer url={tip.link} controls width="100%" height="100%" />
      <div className="my-1">
        <Button
          loading={loading}
          disabled={loading}
          onClick={handleRemoveTip}
          fullWidth
          color="red"
        >
          Remove
        </Button>
      </div>
    </div>
  )
}

export default TechTips
