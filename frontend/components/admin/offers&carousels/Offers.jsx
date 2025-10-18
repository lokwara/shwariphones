import { AdminHeader } from "@/components";
import { useUser } from "@/context/User";
import {
  CREATE_OFFER,
  CREATE_SALE,
  GET_OFFERS,
  REMOVE_FROM_OFFER,
} from "@/lib/request";
import {
  Accordion,
  Avatar,
  Button,
  Divider,
  Drawer,
  Modal,
  Tabs,
  Image,
  TextInput,
  Popover,
  Badge,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconExclamationMark,
  IconInfoCircleFilled,
  IconPlus,
} from "@tabler/icons-react";
import moment from "moment";
import { useRouter } from "next/router";

import React, { useState } from "react";
import { useMutation, useQuery } from "urql";

function Offers() {
  const router = useRouter();
  const { user } = useUser();

  const [loadingAdd, setLoadingAdd] = useState(false);

  const [offer, setOffer] = useState({
    label: null,
    repeat: null,
    start: null,
    end: null,
  });

  const [_, _addOffer] = useMutation(CREATE_OFFER);

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_OFFERS,
  });

  const [newOfferDrawer, setNewOfferDrawer] = useState(false);

  const handleOpenNewOfferDrawer = () => {
    setNewOfferDrawer(true);
    return;
  };

  const handleCloseNewOfferDrawer = () => {
    setNewOfferDrawer(false);
    return;
  };

  const handleAddOffer = () => {
    const payload = {
      label: offer?.label,
      start: new Date(offer?.start).getTime().toString(),
      end: new Date(offer?.end).getTime().toString(),
      createdBy: user?.id,
    };

    _addOffer({
      ...payload,
    })
      .then(({ data }, error) => {
        if (data?.createOffer && !error) {
          notifications.show({
            title: "Offer saved successfully",
            icon: <IconCheck />,
            color: "green",
          });
          handleCloseNewOfferDrawer();
          reexecuteQuery();

          setOffer({
            label: null,
            repeat: null,
            start: null,
            end: null,
          });
        } else {
          notifications.show({
            title: "An error occured",
            icon: <IconInfoCircleFilled />,
            color: "red",
          });
        }
      })
      .finally(() => {
        setLoadingAdd(false);
      });
  };

  // Removing device from offer

  const [__, _removeFromOffer] = useMutation(REMOVE_FROM_OFFER);

  const removeDevice = (deviceId) => {
    _removeFromOffer({
      removeFromOfferId: deviceId,
    }).then(({ data }, error) => {
      if (error) {
        notifications.show({
          title: "Something went wrong!",
          color: "red",
          icon: <IconExclamationMark />,
        });
        return;
      }

      reexecuteQuery();
    });
  };

  if (fetching) return <p>Loading ....</p>;
  if (error) return <p>Error</p>;

  const items = data?.getOffers?.map((offer, i) => (
    <Accordion.Item style={{ background: "white" }} key={`${i}`} value={`${i}`}>
      <Accordion.Control>
        <div>
          <div className="w-[90%] justify-between flex">
            <strong>{offer?.info?.label}</strong>
            <p className="text-slate-500">
              Runs from{" "}
              <strong>
                {moment(new Date(parseInt(offer?.info?.start))).format(
                  "Do MMM YYYY HH:mm"
                )}{" "}
              </strong>
              to{" "}
              <strong>
                {moment(new Date(parseInt(offer?.info?.end))).format(
                  "Do MMM YYYY HH:mm"
                )}
              </strong>
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Avatar
              size={24}
              src={offer?.info?.createdBy?.image}
              alt="it's me"
            />
            <p className="text-slate-500 text-[0.7rem]">
              Created by <strong>{offer?.info?.createdBy?.name}</strong> on{" "}
              <strong>
                {moment(new Date(parseInt(offer?.info?.createdAt))).format(
                  "Do MMM YYYY | HH:mm"
                )}
              </strong>
            </p>
          </div>{" "}
        </div>
      </Accordion.Control>
      <Accordion.Panel>
        <Divider label="Devices" labelPosition="left" />
        <div className="space-y-3">
          {offer?.devices?.map((device, i) => {
            return (
              <div
                key={i}
                className={`flex justify-between p-4 ${
                  device?.status == "Sold" && "bg-red-100"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Image
                    className="h-[60px] w-auto object-contain"
                    src={device?.color?.images[0]}
                  />
                  <div>
                    <strong>{device?.variant?.model}</strong>
                    <p className="text-[0.7rem]">IMEI : {device?.imei}</p>
                    <p className="text-[0.7rem]">
                      Serial No: {device?.serialNo}
                    </p>
                  </div>
                </div>

                {device?.status == "Sold" ? (
                  <Badge color="red">SOLD</Badge>
                ) : user?.adminRights?.includes("OFFER_MANAGEMENT") ? (
                  <Popover width={300} position="bottom" withArrow shadow="md">
                    <Popover.Target>
                      <Button size="xs">Remove</Button>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <div className="space-y-2 p-2">
                        <strong>Confirm removal</strong>
                        <p className="text-slate-500">
                          Are you sure you want to remove this device from this
                          offer?
                        </p>

                        <Button
                          fullWidth
                          size="xs"
                          onClick={() => removeDevice(device?.id)}
                        >
                          Yes , remove
                        </Button>
                      </div>
                    </Popover.Dropdown>
                  </Popover>
                ) : null}
              </div>
            );
          })}
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  ));

  return (
    <div className="bg-slate-100 p-8 w-full h-screen relative">
      <h1 className="text-xl font-bold">Offers</h1>
      <br />
      <Accordion defaultValue="Apples">
        <div className="space-y-3 mt-6 h-[calc(100vh-200px)] overflow-y-auto">
          {items}
        </div>
      </Accordion>

      {user?.adminRights?.includes("OFFER_MANAGEMENT") && (
        <div className="fixed bottom-8 right-8">
          <Button
            p={0}
            w={50}
            h={50}
            radius={50}
            onClick={handleOpenNewOfferDrawer}
          >
            <IconPlus />
          </Button>
        </div>
      )}

      <Modal
        centered
        opened={newOfferDrawer}
        onClose={handleCloseNewOfferDrawer}
        title={<h1 className="font-bold p-4 text-[1.2rem]">New offer</h1>}
      >
        <div className="p-4 space-y-4">
          <TextInput
            label="Offer label"
            placeholder="ex. Black Friday deals"
            value={offer?.label}
            onChange={(e) =>
              setOffer((_offer) => ({ ..._offer, label: e.target.value }))
            }
          />
          <DateTimePicker
            valueFormat="DD MMM YYYY - HH:mm a"
            onChange={(date) =>
              setOffer((_offer) => ({ ..._offer, start: date }))
            }
            clearable
            maxDate={offer?.end}
            label="Start date and time"
            placeholder="Pick date and time"
          />

          <DateTimePicker
            valueFormat="DD MMM YYYY - HH:mm a"
            minDate={offer?.start}
            onChange={(date) =>
              setOffer((_offer) => ({ ..._offer, end: date }))
            }
            clearable
            label="End date and time"
            placeholder="Pick date and time"
          />

          {/* <br />
          <div>
            <strong>Add devices to this sale</strong>

            <div></div>
          </div> */}

          <Button
            fullWidth
            onClick={handleAddOffer}
            loading={loadingAdd}
            disabled={loadingAdd}
          >
            Save offer
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Offers;
