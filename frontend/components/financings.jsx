import { useUser } from "@/context/User";
import { CANCEL_FINANCING_REQUEST } from "@/lib/request";
import { Badge, Button, Image, Popover, Tooltip } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconCancel, IconCheck, IconClipboard } from "@tabler/icons-react";
import { useRouter } from "next/router";

import React, { useState } from "react";
import { useMutation } from "urql";

function Financings({ financialRequests }) {
  const { width } = useViewportSize();

  if (financialRequests?.length > 0) {
    return (
      <div className="py-8 space-y-6">
        {financialRequests?.map((request, i) => (
          <FRequest request={request} key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="py-8 ">
      <div className="bg-white rounded-lg p-8 lg:flex lg:m-24">
        {width > 750 && <img src="/no-order.svg" className="mx-auto" />}

        <div>
          <h1 className="text-[1.4rem] font-semibold">
            It is pretty hard to believe
          </h1>
          <br />
          <p className="text-gray-600">
            But it looks like you haven&apos;t purchased anything on
            Shwariphones yet.
          </p>
          <br />
          {width < 750 && <img src="/no-order.svg" className="mx-auto" />}
          <br />
          <Button size="lg" fullWidth onClick={() => router.push("/all")}>
            Shop sweet deals
          </Button>
        </div>
      </div>
    </div>
  );
}

const FRequest = ({ request }) => {
  const { refreshApp } = useUser();
  const router = useRouter();

  const [popoverOpened, setPopoverOpened] = useState(false);

  const [loadingCancel, setLoadingCancel] = useState(false);
  const [_, _cancelRequest] = useMutation(CANCEL_FINANCING_REQUEST);

  const handleCancellation = () => {
    setLoadingCancel(true);

    _cancelRequest({
      request: request?.id,
    })
      .then(({ data, error }) => {
        if (data && !error) {
          notifications.show({
            title: "Request cancelled",
            color: "green",
          });
          router.reload();
        } else {
          notifications.show({
            title: "Cancellation failed",
            color: "red",
          });
        }
      })
      .catch((err) => {
        notifications.show({
          title: "Cancellation failed",
          color: "red",
        });
      })
      .finally(() => {
        router.push("/account?financing=true");
        refreshApp();
        setPopoverOpened(false);
        setLoadingCancel(false);
      });
  };

  return (
    <div className="bg-white relative flex flex-col justify-items-end ">
      <div className="flex space-x-4 items-center py-8 px-2 relative">
        {request?.status == "PROCESSING" && (
          <Tooltip label="One of our staff will contact you shortly">
            <div className="flex space-x-2 bg-blue-200 rounded-md py-1 px-2 w-[120px]  absolute top-[-12px] right-[0px]">
              <IconClipboard size={20} />
              <span className="text-[0.8rem] ">Processing</span>
            </div>
          </Tooltip>
        )}

        {request?.status == "CANCELLED" && (
          <Tooltip label="Some of the requirements were not met">
            <div className="flex space-x-2 bg-red-200 rounded-md py-1 px-2 w-[120px]  absolute top-[-12px] right-[0px]">
              <IconCancel size={20} />
              <span className="text-[0.8rem] ">Cancelled</span>
            </div>
          </Tooltip>
        )}

        {request?.status == "APPROVED" && (
          <Tooltip label="Some of the requirements were not met">
            <div className="flex space-x-2 bg-green-200 rounded-md py-1 px-2 w-[120px]  absolute top-[-12px] right-[0px]">
              <IconCheck size={20} />
              <span className="text-[0.8rem] ">Approved</span>
            </div>
          </Tooltip>
        )}

        <div>
          <img
            className="h-[85px] w-auto object-contain"
            src={
              request?.device?.variant?.colors?.find(
                ({ id }) => id == request?.device?.color
              )?.images[0]
            }
          />
        </div>
        <div className="space-y-1">
          <div className="space-x-1 mb-2">
            <span className="text-[0.7rem]">Financing request to</span>

            {request?.financer == "buySimu" ? (
              <img
                src="/bs.png"
                alt="buysimu"
                className="h-[22px] mr-2 inline"
              />
            ) : (
              <img
                src="/chanteq.png"
                alt="chanteq"
                className="h-[24px] mr-2 inline"
              />
            )}
          </div>
          <p
            className=" font-semibold hover:underline hover:cursor-pointer "
            onClick={() =>
              router.push(`/product/${request?.device?.variant?.id}`)
            }
          >
            {request?.device?.variant?.model} -{" "}
            {
              request?.device?.variant?.storages?.find(
                ({ id }) => id == request?.device?.storage
              )?.label
            }{" "}
            -{" "}
            {
              request?.device?.variant?.colors?.find(
                ({ id }) => id == request?.device?.color
              )?.label
            }
          </p>
          <div className="flex space-x-2">
            {/* <p className="text-[0.7rem] text-gray-500">
            {request?.device?.description}
          </p> */}
          </div>
          <p className=" font-semibold text-slate-500 ">
            Ksh.{" "}
            {request?.device?.variant?.storages
              ?.find(({ id }) => id == request?.device?.storage)
              ?.price.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {request?.status == "PROCESSING" && (
        <div className="flex w-full justify-end pb-2 pr-2">
          <Popover
            width={300}
            position="bottom"
            withArrow
            shadow="md"
            opened={popoverOpened}
            onChange={setPopoverOpened}
          >
            <Popover.Target>
              <Button
                color="red"
                variant="transparent"
                size="xs"
                onClick={() => setPopoverOpened(true)}
              >
                Cancel request
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <div className="space-y-2">
                <strong>Cancel request</strong>
                <p>Are you sure you want to cancel this financing request?</p>
                <Button
                  size="xs"
                  color="red"
                  fullWidth
                  loading={loadingCancel}
                  disabled={loadingCancel}
                  onClick={handleCancellation}
                >
                  Yes, cancel
                </Button>
              </div>
            </Popover.Dropdown>
          </Popover>
        </div>
      )}
    </div>
  );
};

export default Financings;
