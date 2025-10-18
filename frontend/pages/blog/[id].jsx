import { Footer, Header } from "@/components"
import { GET_BLOG } from "@/lib/request"
import { useRouter } from "next/router"
import React, { useEffect, useRef } from "react"
import { useQuery } from "urql"

function Blog() {
  const router = useRouter()
  const { id } = router.query
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_BLOG,
    variables: {
      getBlogId: id,
    },
  })

  const contentRef = useRef(null)

  useEffect(() => {
    if (contentRef.current && data?.getBlog?.content) {
      contentRef.current.innerHTML = ""
      contentRef.current.insertAdjacentHTML("beforeend", data?.getBlog?.content) // ✅ Appends HTML
    }
  }, [data])

  return (
    <div>
      <Header />

      <div>
        <h2 className="text-[2rem] font-bold font-duplet w-full text-center">
          {data?.getBlog.title}
        </h2>
        <div ref={contentRef} className="prose max-w-none px-4" />
      </div>

      <Footer />
    </div>
  )
}

export default Blog
