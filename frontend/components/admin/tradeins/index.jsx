import TradeInRequests from "./TradeInsRequests";

function TradeInRequestsContainer() {
  return (
    <div className="bg-slate-100 p-8 w-full h-screen">
      <h1 className="text-xl font-bold">Trade-in requests</h1>
      <br />

      <TradeInRequests />
    </div>
  );
}

export default TradeInRequestsContainer;
