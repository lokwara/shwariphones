import { Checkbox } from "@mantine/core";
import React from "react";
import { useNumericMenu } from "react-instantsearch";

function PriceFilter() {
  const { items, refine } = useNumericMenu({
    attribute: "price",
    items: [
      { label: "All" },
      { label: "Less than Ksh.25,000", end: 25000 },
      { label: "Between Ksh.25,000 - Ksh.50,000", start: 25000, end: 50000 },
      { label: "Between Ksh.50,000 - Ksh.75,000", start: 50000, end: 75000 },
      { label: "More than Ksh.75,000", start: 75000 },
    ],
  });

  return (
    <div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.value}>
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={item.isRefined}
                onChange={() => refine(item.value)}
                label={`${item.label}`}
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PriceFilter;
