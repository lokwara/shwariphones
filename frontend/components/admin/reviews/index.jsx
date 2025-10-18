import { GET_REVIEWS, UPDATE_REVIEW } from "@/lib/request"
import { Avatar, Button, Card, Divider, Rating, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
  IconBookmark,
  IconBookmarkFilled,
  IconCalendar,
  IconCheck,
  IconTrash,
} from "@tabler/icons-react"
import moment from "moment"
import React, { useState } from "react"
import { useMutation, useQuery } from "urql"

function Reviews() {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_REVIEWS,
  })

  let featured = data?.getReviews?.filter((review) => review?.featured) ?? []

  let others = data?.getReviews?.filter((review) => !review?.featured) ?? []

  return (
    <div className="bg-slate-100 p-8 w-full h-screen relative">
      <h1 className="text-xl font-bold">Reviews</h1>
      <br />
      <div className="space-y-4 h-[calc(100vh-100px)] no-scrollbar overflow-y-auto ">
        <Divider label="Featured" labelPosition="right" />
        <br />
        {featured.map((review) => (
          <Review
            key={review?.id}
            review={review}
            reexecuteQuery={reexecuteQuery}
          />
        ))}
        <Divider label="Others" labelPosition="right" />
        {others.map((review) => (
          <Review
            review={review}
            key={review?.id}
            reexecuteQuery={reexecuteQuery}
          />
        ))}
      </div>
    </div>
  )
}

const Review = ({ review, reexecuteQuery }) => {
  const [featureLoading, setFeatureLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [_, _updateReview] = useMutation(UPDATE_REVIEW)

  const handleFeature = () => {
    setFeatureLoading(true)

    _updateReview({
      featured: review?.featured ? false : true,
      reviewId: review?.id,
    })
      .then(({ data }, error) => {
        if (data && !error) {
          notifications.show({
            title: review?.featured
              ? "Review removed from features"
              : "Review now featured",
            color: "green",
            icon: <IconCheck />,
          })
          setFeatureLoading(false)
          return
        }

        notifications.show({
          title: "Error performing action",
          color: "red",
        })
        reexecuteQuery()
        setFeatureLoading(false)
        return
      })
      .catch((err) => {
        notifications.show({
          title: "Error performing action",
          color: "red",
        })
        setFeatureLoading(false)
        return
      })
  }

  const handleDelete = () => {
    setDeleteLoading(true)

    _updateReview({
      reviewId: review?.id,
      removed: true,
    })
      .then(({ data }, error) => {
        if (data && !error) {
          notifications.show({
            title: "Review removed successfully",
            color: "green",
            icon: <IconCheck />,
          })
          setDeleteLoading(false)
          return
        }

        notifications.show({
          title: "Error performing action",
          color: "red",
        })
        reexecuteQuery()
        setDeleteLoading(false)
        return
      })
      .catch((err) => {
        notifications.show({
          title: "Error performing action",
          color: "red",
        })
        setDeleteLoading(false)
        return
      })
  }

  return (
    <div className="flex p-4 space-x-4">
      {review?.image ? (
        <img
          src={review?.image}
          alt="item"
          className="h-[200px] aspect-square"
        />
      ) : (
        <div className="h-[200px] aspect-square bg-gray-200 flex items-center justify-center rounded-md text-gray-500 text-sm">
          No Image Available
        </div>
      )}

      <div className="w-full">
        <div className="flex  justify-between">
          <div className="flex items-center space-x-2">
            <Avatar color="red" src={review?.customer?.image} />

            <p className="font-bold">{review?.customer?.name}</p>
          </div>

          <div className="flex items-center space-x-2">
            <IconCalendar className="" stroke={1} />
            <p>{moment(new Date(review.date)).format("Do MMM YYYY")}</p>
          </div>
        </div>
        <br />
        <p>{review.review}</p>
        <br />
        <div className="flex justify-between items-center">
          <div className="p-3 bg-white inline-block">
            <div className="flex space-x-6">
              <img
                src={review.product.colors[0].images[0]}
                alt="1"
                className="h-[48px] aspect-square w-[48px]"
              />

              <div className="space-y-1">
                <p className="font-bold">{review?.product?.model}</p>
                <Rating size={12} defaultValue={5} />
              </div>
            </div>
          </div>

          <Button.Group>
            <Button
              onClick={handleFeature}
              variant="outline"
              leftSection={
                !review?.featured ? (
                  <IconBookmark size={16} stroke={1} />
                ) : (
                  <IconBookmarkFilled size={16} />
                )
              }
            >
              {!review.featured ? "Feature" : "Unfeature"}
            </Button>
            <Button
              onClick={handleDelete}
              color="red"
              leftSection={<IconTrash size={16} stroke={1} />}
            >
              Delete
            </Button>
          </Button.Group>
        </div>
      </div>
    </div>
  )
}

export default Reviews
