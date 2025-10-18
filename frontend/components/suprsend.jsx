import dynamic from "next/dynamic";

// Dynamically import the SuprSendInbox component with SSR disabled
const SuprSendInbox = dynamic(() => import("@suprsend/react-inbox"), {
  ssr: false,
});
