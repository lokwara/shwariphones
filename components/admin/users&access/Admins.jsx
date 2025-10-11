import { useUser } from "@/context/User";
import { EDIT_RIGHTS, GET_ADMINS, REMOVE_ADMIN } from "@/lib/request";
import { Button, Card, Checkbox, Code, Modal, Popover } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { AgGridReact } from "ag-grid-react";
import moment from "moment";
import React, { useState } from "react";
import { useMutation, useQuery } from "urql";

function Admins() {
  const { height } = useViewportSize();
  const { user } = useUser();

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_ADMINS,
  });

  const MoreRender = ({ data }) => {
    const [rightsOpen, setRightsOpen] = useState(false);
    const [rights, setRights] = useState(data?.adminRights);
    const [loading, setLoading] = useState(false);

    const [_, _editRights] = useMutation(EDIT_RIGHTS);
    const [__, _removeAdmin] = useMutation(REMOVE_ADMIN);

    const handleSaveRights = () => {
      setLoading(true);

      const payload = {
        rights,
        editRightsId: data?.id,
        changedBy: user?.id,
      };

      _editRights(payload)
        .then(({ data }, error) => {
          if (data?.editRights) {
            setLoading(false);
            setRights([]);
            setRightsOpen(false);
            return;
          } else {
            notifications.show({
              title: "Oops",
              message: "Something went wrong!",
              color: "red",
            });
            setLoading(false);
            return;
          }
        })
        .catch((err) => {
          notifications.show({
            title: "Oops",
            message: "Something went wrong!",
            color: "red",
          });
          setLoading(false);
          return;
        });
    };

    const handleRemoveAdmin = () => {
      setLoading(true);

      _removeAdmin({
        removeAdminId: data?.id,
      })
        .then(({ data }, error) => {
          if (error) {
            notifications.show({
              title: "Oops!",
              message: "Something went wrong",
              color: "red",
            });
            setLoading(false);
          }
        })
        .catch((err) => {
          notifications.show({
            title: "Oops!",
            message: "Something went wrong",
            color: "red",
          });
          setLoading(false);
        });
    };

    if (data?.id == user?.id) return;

    return (
      <div className="items-center pt-1">
        <Button.Group>
          <Button size="xs" onClick={() => setRightsOpen(true)}>
            Edit rights
          </Button>

          <Popover width={300} position="bottom" withArrow shadow="md">
            <Popover.Target>
              <Button size="xs" color="red">
                Remove
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <div className="space-y-2 p-2">
                <strong>Confirm removal</strong>
                <p className="text-slate-500">
                  Are you sure you want to remove this admin. This action is
                  irreversible.
                </p>

                <Button fullWidth size="xs" onClick={handleRemoveAdmin}>
                  Yes, remove
                </Button>
              </div>
            </Popover.Dropdown>
          </Popover>
        </Button.Group>

        <Modal
          title={<h1 className="text-[1.2rem] font-bold">Edit rights</h1>}
          opened={rightsOpen}
          onClose={() => setRightsOpen(false)}
        >
          <div className="p-2 space-y-1">
            <Card shadow="lg">
              <strong>{data?.name}</strong>
              <p>{data?.email}</p>
              <p>{data?.phoneNumber}</p>
            </Card>
            <br />

            <Checkbox.Group
              value={rights}
              defaultChecked={data?.adminRights}
              onChange={setRights}
            >
              <div className="space-y-1">
                <Checkbox
                  disabled={!user?.adminRights?.includes("ADD_VARIANT")}
                  value="ADD_VARIANT"
                  label="Add variants"
                />
                <Checkbox
                  disabled={!user?.adminRights?.includes("EDIT_VARIANT")}
                  value="EDIT_VARIANT"
                  label="Edit variants"
                />
                <Checkbox
                  disabled={!user?.adminRights?.includes("ADD_DEVICE")}
                  value="ADD_DEVICE"
                  label="Add devices"
                />
                <Checkbox
                  disabled={!user?.adminRights?.includes("EDIT_DEVICE")}
                  value="EDIT_DEVICE"
                  label="Edit devices"
                />
                <Checkbox
                  disabled={!user?.adminRights?.includes("ADD_REPAIR")}
                  value="ADD_REPAIR"
                  label="Add repairs"
                />
                <Checkbox
                  disabled={!user?.adminRights?.includes("UPDATE_REPAIR")}
                  value="UPDATE_REPAIR"
                  label="Update repairs"
                />
                <Checkbox
                  disabled={!user?.adminRights?.includes("UPDATE_ORDER")}
                  value="UPDATE_ORDER"
                  label="Update order (Dispatch & Collection)"
                />
                <Checkbox
                  disabled={!user?.adminRights?.includes("APPROVE_TRADEINS")}
                  value="APPROVE_TRADEINS"
                  label="Approve/Cancel tradeins"
                />

                <Checkbox
                  disabled={!user?.adminRights?.includes("APPROVE_FINANCINGS")}
                  value="APPROVE_FINANCINGS"
                  label="Approve/Reject financings"
                />

                <Checkbox
                  disabled={!user?.adminRights?.includes("OFFER_MANAGEMENT")}
                  value="OFFER_MANAGEMENT"
                  label="Create & update offers "
                />
                <Checkbox
                  disabled={!user?.adminRights?.includes("CAROUSEL_MANAGEMENT")}
                  value="CAROUSEL_MANAGEMENT"
                  label="Create & remove carousels "
                />
                <Checkbox
                  disabled={!user?.adminRights?.includes("ADMIN_MANAGEMENT")}
                  value="ADMIN_MANAGEMENT"
                  label="Add & remove admins & edit rights "
                />
              </div>
            </Checkbox.Group>
            <br />

            <Button
              loading={loading}
              disabled={loading}
              fullWidth
              onClick={handleSaveRights}
            >
              Save changes
            </Button>
          </div>
        </Modal>
      </div>
    );
  };

  const formatText = (text) => {
    return text
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const colDefs = [
    {
      field: "name",
      width: 200,
      filter: true,
      floatingFilter: true,
    },

    {
      field: "adminRights",
      filter: true,
      width: 200,
      floatingFilter: true,
      cellRenderer: ({ value }) => (
        <div className="space-x-1">
          {value.map((el, i) => (
            <Code key={i}>{formatText(el)}</Code>
          ))}
        </div>
      ),
    },

    {
      width: 200,
      field: "",
      cellRenderer: MoreRender,
    },
  ];

  return (
    <div>
      <div
        className="ag-theme-quartz mt-4" // applying the Data Grid theme
        style={{ height: height - 150 }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact rowData={data?.getAdmins} columnDefs={colDefs} />
      </div>
    </div>
  );
}

export default Admins;
