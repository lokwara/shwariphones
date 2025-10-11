import { useUser } from "@/context/User.jsx"
import {
  ADD_BLOG,
  DELETE_BLOG,
  GET_BLOG,
  GET_BLOGS,
  UPDATE_BLOG,
} from "@/lib/request.js"
import { Avatar, Button, Drawer, Modal, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
  IconArrowUp,
  IconCalendar,
  IconCheck,
  IconPlus,
  IconX,
} from "@tabler/icons-react"
import { CldUploadWidget } from "next-cloudinary"
import dynamic from "next/dynamic"
import Link from "next/link.js"
import React, { useEffect, useState } from "react"
import { useMutation, useQuery } from "urql"

const Editor = dynamic(() => import("./new.jsx"), { ssr: false })

const Story = ({ blog, refetchBlogs }) => {
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [_, _deleteBlog] = useMutation(DELETE_BLOG)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)

  const [thumbnail, setThumbnail] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")

  useEffect(() => {
    if (blog) {
      setThumbnail(blog.thumbnail ?? "")
      setTitle(blog.title ?? "")
      setContent(blog.content ?? "")
      setCategory(blog.category ?? "")
    }
  }, [blog])

  const [__, _updateBlog] = useMutation(UPDATE_BLOG)

  const handleDeleteBlog = () => {
    setDeleteLoading(true)

    _deleteBlog({
      removeBlogId: blog?.id,
    })
      .then(({ data }, error) => {
        if (data && !error) {
          notifications.show({
            title: "Blog deleted successfully",
            color: "green",
            icon: <IconCheck />,
          })

          return
        }

        notifications.show({
          title: "Error deleting blog , try again later",
          color: "red",
        })
        return
      })
      .catch((err) => {
        notifications.show({
          title: "Error deleting blog , try again later",
          color: "red",
        })
      })
      .finally(() => {
        setDeleteLoading(false)
        refetchBlogs()
      })
  }

  const handleOpenDrawer = () => {
    setEditDrawerOpen(true)
  }

  const handleSaveBlog = (editorContent) => {
    _updateBlog({
      updateBlogId: blog?.id,
      content: editorContent,
      title,
      thumbnail,
      category,
    }).then(({ data }, error) => {
      if (data && !error) {
        setEditDrawerOpen(false)
        setTitle("")
        setCategory("")
        setThumbnail(null)

        notifications.show({
          title: "Blog modified successfully",
          color: "green",
        })

        refetchBlogs()

        return
      }

      notifications.show({
        title: "Error saving blog, try again later",
        color: "red",
      })
      return
    })
  }

  return (
    <div className="curor-hover col-span-1 space-y-4">
      <div className="h-[250px] bg-red-200 bg-opacity-10">
        <img
          src={blog?.thumbnail}
          alt=""
          className="w-full h-[250px] object-cover"
        />
      </div>

      <div>
        <p className="font-bold text-[0.9rem]">{blog?.title}</p>
        <p className="text-slate-400">{blog.category}</p>
      </div>

      <Button.Group>
        <Button onClick={handleOpenDrawer} fullWidth variant="outline">
          Edit
        </Button>
        <Button
          loading={deleteLoading}
          disabled={deleteLoading}
          onClick={handleDeleteBlog}
          color="red"
          fullWidth
        >
          Delete
        </Button>
      </Button.Group>

      <Drawer
        size="100%"
        opened={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        title={<h1 className="font-bold p-4 text-[1.2rem]">Edit blog</h1>}
      >
        <div className="flex space-x-12 items-center">
          {thumbnail ? (
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
                      onClick={() => setThumbnail(null)}
                    >
                      <IconX />
                    </Button>
                  </div>
                  <img
                    src={`${thumbnail}`}
                    className="w-[300px] aspect-square object-cover"
                    alt={`image`}
                  />
                </div>
              </div>
            </div>
          ) : (
            <CldUploadWidget
              uploadPreset="shwariphones"
              onSuccess={(result, { widget }) => {
                setThumbnail(result?.info?.secure_url)
              }}
              onQueuesEnd={(result, { widget }) => {
                widget.close()
              }}
            >
              {({ open }) => {
                function handleOnClick() {
                  setThumbnail(null)
                  open()
                }
                return (
                  <div
                    onClick={handleOnClick}
                    className=" w-[300px] relative aspect-square border border-dashed bg-gray-200 items-center"
                  >
                    <div className="font-semibold space-y-4 w-4/5 absolute top-[50%] right-[50%] translate-y-[-50%] translate-x-[50%]">
                      <p className="w-full text-center text-[2rem] font-light">
                        +
                      </p>
                      <p className="w-full text-center">
                        Upload thumbnail image
                      </p>
                    </div>
                  </div>
                )
              }}
            </CldUploadWidget>
          )}

          <div>
            <TextInput
              className="text-[3rem] font-bold"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Blog title"
              unstyled
            />

            <TextInput
              value={category}
              unstyled
              placeholder="Category"
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </div>

        <br />
        <Editor edit content={content} saveBlog={handleSaveBlog} />
      </Drawer>
    </div>
  )
}

function Blogs() {
  const [newBlog, setNewBlog] = useState(false)
  const { user } = useUser()

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_BLOGS,
  })

  const handleCloseNewBlog = () => {
    setNewBlog(false)
  }

  const [_, _addBlog] = useMutation(ADD_BLOG)

  const [title, setTitle] = useState("")
  const [thumbnail, setThumbnail] = useState("")
  const [category, setCategory] = useState("")

  const handleSaveBlog = (editorContent) => {
    _addBlog({
      content: editorContent,
      createdBy: user?.id,
      title,
      thumbnail,
      category,
    }).then(({ data }, error) => {
      if (data && !error) {
        setNewBlog(false)
        setTitle("")
        setCategory("")
        setThumbnail(null)

        notifications.show({
          title: "Blog saved successfully",
          color: "green",
        })

        reexecuteQuery()

        return
      }

      notifications.show({
        title: "error saving blog, try again later",
        color: "red",
      })
      return
    })
  }

  return (
    <div className="bg-slate-100 p-8 w-full h-screen relative">
      <h1 className="text-xl font-bold">Blogs</h1>
      <br />
      <div className="space-y-4 h-[calc(100vh-100px)] no-scrollbar overflow-y-auto ">
        <div className="py-8 gap-8 grid grid-cols-3">
          {data?.getBlogs.map((blog) => (
            <Story refetchBlogs={reexecuteQuery} key={blog.id} blog={blog} />
          ))}
        </div>
      </div>

      <div className="fixed bottom-8 right-8">
        <Button
          p={0}
          w={50}
          h={50}
          radius={50}
          onClick={() => setNewBlog(true)}
        >
          <IconPlus />
        </Button>
      </div>

      <Drawer
        size="100%"
        opened={newBlog}
        onClose={handleCloseNewBlog}
        title={<h1 className="font-bold p-4 text-[1.2rem]">New blog</h1>}
      >
        <div className="flex space-x-12 items-center">
          {thumbnail ? (
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
                      onClick={() => setThumbnail(null)}
                    >
                      <IconX />
                    </Button>
                  </div>
                  <img
                    src={`${thumbnail}`}
                    className="w-[300px] aspect-square object-cover"
                    alt={`image`}
                  />
                </div>
              </div>
            </div>
          ) : (
            <CldUploadWidget
              uploadPreset="shwariphones"
              onSuccess={(result, { widget }) => {
                setThumbnail(result?.info?.secure_url)
              }}
              onQueuesEnd={(result, { widget }) => {
                widget.close()
              }}
            >
              {({ open }) => {
                function handleOnClick() {
                  setThumbnail(null)
                  open()
                }
                return (
                  <div
                    onClick={handleOnClick}
                    className=" w-[300px] relative aspect-square border border-dashed bg-gray-200 items-center"
                  >
                    <div className="font-semibold space-y-4 w-4/5 absolute top-[50%] right-[50%] translate-y-[-50%] translate-x-[50%]">
                      <p className="w-full text-center text-[2rem] font-light">
                        +
                      </p>
                      <p className="w-full text-center">
                        Upload thumbnail image
                      </p>
                    </div>
                  </div>
                )
              }}
            </CldUploadWidget>
          )}

          <div>
            <TextInput
              className="text-[3rem] font-bold"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Blog title"
              unstyled
            />

            <TextInput
              value={category}
              unstyled
              placeholder="Category"
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </div>

        <br />
        <Editor saveBlog={handleSaveBlog} />
      </Drawer>
    </div>
  )
}

export default Blogs
