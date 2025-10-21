import { useEffect, useRef } from "react"
import { Editor } from "@tinymce/tinymce-react"
import { Button } from "@mantine/core"

export default function New({ saveBlog, content, edit }) {
  const editorRef = useRef(null)

  const log = () => {
    if (editorRef.current) {
      saveBlog(editorRef.current.getContent())
    }
  }

  return (
    <>
      <Editor
        apiKey="4ebrsavb7jiac55bit68bh4xu6o3ksgsavrbqfum4yvdmq5k"
        onInit={(_evt, editor) => (editorRef.current = editor)}
        initialValue={
          content
            ? content
            : "<p>This is the initial content of the editor.</p>"
        }
        init={{
          height: 500,
          menubar: false,
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "code",
            "help",
            "wordcount",
          ],
          toolbar:
            "undo redo | blocks | " +
            "bold italic forecolor | alignleft aligncenter " +
            "alignright alignjustify | bullist numlist outdent indent | " +
            "image | removeformat | help",

          content_style:
            "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",

          // 👇 Enable image upload tab in image dialog
          image_title: true,
          automatic_uploads: true,

          // 👇 Enable paste & drag-drop image upload
          file_picker_types: "image",

          file_picker_callback: function (cb, value, meta) {
            if (meta.filetype === "image") {
              const input = document.createElement("input")
              input.setAttribute("type", "file")
              input.setAttribute("accept", "image/*")

              input.onchange = async function () {
                const file = this.files[0]

                // 👉 Upload to Cloudinary or your backend
                const formData = new FormData()
                formData.append("file", file)
                formData.append("upload_preset", "shwariphones") // Only for unsigned upload
                const res = await fetch(
                  "https://api.cloudinary.com/v1_1/oligarch/image/upload",
                  {
                    method: "POST",
                    body: formData,
                  }
                )

                const data = await res.json()
                cb(data.secure_url, { title: file.name })
              }

              input.click()
            }
          },
        }}
      />

      <br />
      <Button onClick={log}>{edit ? "Edit blog" : "Save blog"}</Button>
    </>
  )
}
