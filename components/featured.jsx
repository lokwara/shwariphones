import { Button } from "@mantine/core"
import { useRouter } from "next/router"
import React from "react"

function Featured({ blog }) {
  return (
    <section className="mt-12 space-y-4 px-8">
      <h1 className="font-medium font-duplet text-[2rem] text-center">
        Latest Stories
      </h1>

      <br />
      <FeaturedStory blog={blog} />
    </section>
  )
}

const FeaturedStory = ({ blog }) => {
  const router = useRouter()

  return (
    <div className="lg:grid grid-cols-2 gap-x-8 w-4/5 mx-auto">
      <div className="h-full col-span-1">
        <img
          src={blog?.thumbnail}
          className="max-h-[300px] w-full object-cover"
          alt="thumbnail"
        />
      </div>

      <div className="lg:space-y-8 space-y-4 lg:py-12 py-6">
        <p className="uppercase text-slate-500 tracking-wider">
          {blog?.category}
        </p>
        <h1 className="font-medium text-[2rem] leading-10">{blog?.title}</h1>

        <Button radius={48} onClick={() => router.push(`/blog/${blog.id}`)}>
          Read More
        </Button>
      </div>
    </div>
  )
}

export default Featured
