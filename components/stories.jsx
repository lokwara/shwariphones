import { Button, Tabs } from "@mantine/core"
import { IconArrowUp } from "@tabler/icons-react"
import Link from "next/link"
import React from "react"

function Stories({ allBlogs }) {
  const categories = [
    ...new Map(
      allBlogs
        ?.map((blog) => blog.category)
        .map((name) => [name.toLowerCase(), name])
    ).values(),
  ]

  return (
    <div className="lg:p-12 px-3">
      <Tabs defaultValue="all">
        <Tabs.List>
          <Tabs.Tab value="all">ALL</Tabs.Tab>
          {categories?.map((category) => (
            <Tabs.Tab key={category} value={category}>
              {category.toUpperCase()}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value="all">
          <div className="py-8 gap-8 lg:grid p-8 space-y-12 grid-cols-3">
            {allBlogs?.map((blog) => (
              <Story blog={blog} key={blog.id} />
            ))}
          </div>
        </Tabs.Panel>
        {categories.map((cat) => (
          <Tabs.Panel value={cat} key={cat}>
            <div className="py-8 gap-8 lg:grid p-8 space-y-12 grid-cols-3">
              {allBlogs
                .filter(
                  (blog) => blog.category.toLowerCase() == cat.toLowerCase()
                )
                .map((blog) => (
                  <Story blog={blog} key={blog.id} />
                ))}
            </div>
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  )
}

const Story = ({ blog }) => {
  return (
    <div className="col-span-1 space-y-4">
      <div className="h-[250px]">
        <img
          src={blog?.thumbnail}
          alt="blog"
          className="h-full w-full object-cover"
        />
      </div>
      <p className="font-bold text-[0.9rem]">{blog?.title}</p>

      <Link className="flex  font-semibold" href={`/blog/${blog.id}`}>
        <p className="hover:underline ">Read more</p>
        <IconArrowUp size={12} className="rotate-[45deg] mt-1" />
      </Link>
    </div>
  )
}

export default Stories
