import { useUser } from "@/context/User";
import { ADD_ADMIN, GET_ADMINS, GET_CUSTOMERS } from "@/lib/request";
import { Button } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { AgGridReact } from "ag-grid-react";
import React, { useState } from "react";
import { useMutation, useQuery } from "urql";

function Customers() {
  const { height } = useViewportSize();

  const [{ data }, reexecuteQuery] = useQuery({
    query: GET_CUSTOMERS,
  });

  const More = ({ data }) => {
    const [_, _addAdmin] = useMutation(ADD_ADMIN);
    const [loading, setLoading] = useState(false);

    const handleMakeAdmin = () => {
      setLoading(true);

      _addAdmin({
        addAdminId: data?.id,
      })
        .then(({ data, error }) => {
          if (data && !error) {
            notifications.show({
              title: "Admin added successfully to the system",
              color: "green",
              message: "Edit the new admin's right in the table on the left",
            });
          }
        })
        .finally(() => setLoading(false));
    };

    if (data?.isAdmin) return;

    return (
      <Button size="xs" onClick={handleMakeAdmin}>
        Make an admin
      </Button>
    );
  };

  const colDefs = [
    {
      field: "name",
      filter: true,
      width: 200,
      floatingFilter: true,
    },
    {
      field: "phoneNumber",
      filter: true,
      width: 150,
      floatingFilter: true,
    },
    {
      field: "email",
      width: 200,
      filter: true,
      floatingFilter: true,
    },

    {
      cellRenderer: More,
    },
  ];

  return (
    <div>
      <div
        className="ag-theme-quartz mt-4" // applying the Data Grid theme
        style={{ height: height - 150 }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact rowData={data?.getCustomers} columnDefs={colDefs} />
      </div>
    </div>
  );
}

export default Customers;
