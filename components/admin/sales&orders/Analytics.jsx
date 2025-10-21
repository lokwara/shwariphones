import Loader from "@/components/loader";
import { GET_SALE_STATS } from "@/lib/request";
import { BarChart, DonutChart } from "@mantine/charts";
import { Divider } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import React from "react";
import { useQuery } from "urql";

function Analytics() {
  const { height, width } = useViewportSize();

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_SALE_STATS,
  });

  return (
    <div
      className="bg-white p-8 overflow-y-auto "
      style={{ height: height - 170 }}
    >
      <div className="grid grid-cols-2 gap-12">
        <div className="col-span-1">
          <Divider label="Sales by day" />
          <br />
          <BarChart
            h={300}
            data={data?.getSalesStatistics?.weeklySales || []}
            barProps={{ barSize: 16 }}
            dataKey="date"
            series={[{ name: "sales", color: "indigo.6" }]}
            tickLine="y"
          />
        </div>

        <div className="col-span-1">
          <Divider label="Sales by month" />
          <br />
          <BarChart
            h={300}
            data={data?.getSalesStatistics?.monthlySales || []}
            barProps={{ barSize: 16 }}
            dataKey="month"
            series={[{ name: "sales", color: "blue.6" }]}
            tickLine="y"
          />
        </div>
      </div>
      <br />
      <br />
      <div className="grid grid-cols-2 gap-12">
        <div className="col-span-1">
          <Divider label="Sales by type" />
          <br />
          <DonutChart
            withLabels
            size={width / 2 - 250}
            labelsType="value"
            chartLabel="Sales"
            data={data?.getSalesStatistics?.saleByType || []}
          />
        </div>

        <div className="col-span-1">
          <Divider label="Financing requests" />
          <br />
          <DonutChart
            withLabels
            size={width / 2 - 250}
            labelsType="value"
            chartLabel="Financing requests  "
            data={data?.getSalesStatistics?.financingRequests || []}
          />
        </div>
      </div>

      <br />
      <br />
      <div className="grid grid-cols-2 gap-12">
        <div className="col-span-1">
          <Divider label="Sales by brand (past 30 days)" />
          <br />
          <BarChart
            h={300}
            data={data?.getSalesStatistics?.saleByBrand || []}
            barProps={{ barSize: 16 }}
            orientation="vertical"
            dataKey="brand"
            series={[{ name: "sales", color: "violet.6" }]}
            tickLine="y"
          />
        </div>

        <div className="col-span-1">
          <Divider label="Sales by model (past 30 days)" />
          <br />
          <BarChart
            h={300}
            data={data?.getSalesStatistics?.saleByModel || []}
            barProps={{ barSize: 16 }}
            orientation="vertical"
            dataKey="model"
            series={[{ name: "sales", color: "violet.6" }]}
            tickLine="y"
          />
        </div>
      </div>
    </div>
  );
}

export default Analytics;
