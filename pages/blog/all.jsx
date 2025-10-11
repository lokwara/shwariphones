import { Footer } from "@/components"
import Featured from "@/components/featured"
import Header from "@/components/header"
import Stories from "@/components/stories"
import { GET_BLOGS } from "@/lib/request"
import React from "react"
import { useQuery } from "urql"

function AllBlogs() {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_BLOGS,
  })
  return (
    <div>
      <Header />

      <Featured blog={data?.getBlogs[0]} />
      <Stories allBlogs={data?.getBlogs} />
      <Footer />
    </div>
  )
}

export default AllBlogs
