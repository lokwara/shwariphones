import { GET_SALES } from "@/lib/request";
import { Badge, Button, Code, Modal } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import { AgGridReact } from "ag-grid-react";
import moment from "moment";
import React, { useState } from "react";
import { useQuery } from "urql";

function Sales() {
  // Mantine hooks
  const { height } = useViewportSize();

  // AG grid renderers
  const SaleVia = ({ value }) => {
    return (
      <Badge
        className="mt-[10px]"
        size="sm"
        radius={"sm"}
        color={value == "walk in" ? "blue" : "green"}
      >
        {value == "walk in" ? "Walk In" : "Web app"}
      </Badge>
    );
  };

  // AG grid column definitions
  const colDefs = [
    {
      field: "variant",
      headerName: "Device",
      filter: true,
      width: 100,
      floatingFilter: true,
    },
    {
      field: "color",
      width: 100,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "storage",
      width: 100,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "imei",
      width: 120,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "serialNo",
      width: 120,
      filter: true,
      floatingFilter: true,
    },

    {
      field: "purchasePrice",
      valueFormatter: (p) => "Ksh." + p?.value?.toLocaleString(),
      filter: true,
      floatingFilter: true,
      width: 150,
    },
    {
      field: "repairCost",
      valueFormatter: (p) => "Ksh." + p?.value?.toLocaleString(),
      filter: true,
      floatingFilter: true,
      width: 120,
    },

    {
      field: "salePrice",
      filter: true,
      valueFormatter: (p) => "Ksh." + p?.value?.toLocaleString(),
      floatingFilter: true,
      width: 100,
    },
    {
      field: "saleDate",
      filter: true,
      valueGetter: ({ data }) =>
        moment(new Date(parseInt(data?.saleDate))).format("Do MMM YYYY"),
      floatingFilter: true,
      width: 120,
    },
    {
      field: "customerName",
      filter: true,
      floatingFilter: true,
    },
    {
      field: "customerPhoneNumber",
      filter: true,
      floatingFilter: true,
    },
    {
      field: "margin",
      filter: true,
      valueFormatter: (p) => "Ksh." + p?.value?.toLocaleString(),
      floatingFilter: true,
    },
    {
      field: "financer",
      filter: true,
      floatingFilter: true,
      cellRenderer: ({ value }) =>
        value ? (
          <Code>{value == "buySimu" ? "BUY SIMU" : "CHANTEQ"}</Code>
        ) : null,
    },
    {
      field: "saleVia",
      filter: true,
      floatingFilter: true,
      cellRenderer: SaleVia,
    },
  ];

  // Requests
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_SALES,
  });

  return (
    <div>
      <div
        className="ag-theme-quartz mt-4" // applying the Data Grid theme
        style={{ height: height - 170 }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact rowData={data?.getSales} columnDefs={colDefs} />
      </div>
    </div>
  );
}

export default Sales;
