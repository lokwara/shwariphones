export default function NumberInput({ label, onChange, value, onBlur }) {
  return (
    <div>
      {label && (
        <>
          <p className="text-[0.9rem] font-medium inline mr-1">{label}</p>
          <span className="text-red-500 inline">*</span>
        </>
      )}

      <div className="flex items-center space-x-2 mt-2">
        <span className="text-[0.8rem]">Ksh.</span>
        <input
          onBlur={onBlur}
          required
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="px-2 py-1 rounded-md border border-slate-300 w-full"
        />
      </div>
    </div>
  );
}
