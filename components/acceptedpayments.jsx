import React from "react";

function AcceptedPayments() {
  return (
    <div className="space-y-2 mb-8">
      <h1 className="font-semibold text-center text-[1.3rem]">
        Accepted Payment Methods
      </h1>
      <p className="text-gray-500 text-center">
        All payments are 100% secured.
      </p>
      <br />
      <div className="grid gap-8 grid-cols-2 lg:grid-cols-4 w-4/5 lg:w-3/5 mx-auto">
        <div className="col-span-1 mx-auto">
          <img
            src="/payments/mpesa.png"
            className="max-w-[100px] object-contain"
            alt="mpesa"
          />
        </div>

        <div className="col-span-1 mx-auto">
          <img
            src="/payments/visa.png"
            className="max-w-[100px] col-span-1 object-contain"
            alt="visa"
          />
        </div>

        <div className="col-span-1 mx-auto">
          <img
            src="/payments/mastercard.png"
            className="max-w-[100px] col-span-1 object-contain"
            alt="mastercard"
          />
        </div>

        <div className="col-span-1 mx-auto">
          <img
            src="/payments/airtel-money.png"
            className="max-w-[100px] col-span-1 object-contain"
            alt="airtel money"
          />
        </div>
      </div>
    </div>
  );
}

export default AcceptedPayments;
