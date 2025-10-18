import React, { useEffect, useState } from "react";
import { ProductCard } from ".";
import { IconClock } from "@tabler/icons-react";
import ProductCardOffer from "./admin/productcardoffer";

function Offer({ offer }) {
  return (
    <div>
      <br />

      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-[1.3rem] font-semibold">{offer?.info?.label}</h1>
        </div>

        <Countdown endTime={parseInt(offer?.info?.end)} />
      </div>
      <br />

      <br />
      <div className=" flex flex-nowrap space-x-6 overflow-x-auto">
        {offer?.devices?.map((device) => (
          <ProductCardOffer key={device?.id} device={device} />
        ))}
      </div>
      <br />
    </div>
  );
}

const Countdown = ({ endTime }) => {
  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const difference = endTime - now;

    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer); // Cleanup the timer on component unmount
  }, [endTime]);

  return (
    // <div className="bg-red-500 p-2 rounded-md text-white flex space-x-1">
    //   <span className="">
    //     <IconClock />
    //   </span>
    //   <span>{timeLeft.hours}h </span>
    //   <span>{timeLeft.minutes}m </span>
    //   <span>{timeLeft.seconds}s</span>
    // </div>

    <div className="flex justify-center items-center space-x-2 text-center">
      <div className="flex flex-col items-center">
        <span className="font-bold text-xl text-red-600">{timeLeft.hours}</span>
        <span className="text-sm text-gray-500">Hours</span>
      </div>
      <div className="flex flex-col items-center">
        <span className=" text-xl font-bold text-red-600">
          {timeLeft.minutes}
        </span>
        <span className="text-sm text-gray-500">Minutes</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xl font-bold text-red-600">
          {timeLeft.seconds}
        </span>
        <span className="text-sm text-gray-500">Seconds</span>
      </div>
    </div>
  );
};

export default Offer;
